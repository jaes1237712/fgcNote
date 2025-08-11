import requests
from pathlib import Path
from urllib.parse import urlparse
import csv
import asyncio
import shutil
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Optional, List, Tuple

try:
    from PIL import Image, UnidentifiedImageError
except Exception:  # Pillow not installed or import failed
    Image = None  # type: ignore
    UnidentifiedImageError = Exception  # type: ignore

def get_all_image_urls(page_title):
    session = requests.Session()
    api_url = "https://wiki.supercombo.gg/api.php"
    params = {
        "action": "query",
        "format": "json",
        "titles": page_title,
        "generator": "images",
        "prop": "imageinfo",
        "iiprop": "url",
        "gimlimit": "500" # 一次最多取得 500 張
    }

    image_urls = []
    while True:
        response = session.get(url=api_url, params=params)
        data = response.json()

        if 'query' in data and 'pages' in data['query']:
            for page_id in data['query']['pages']:
                image_info = data['query']['pages'][page_id].get('imageinfo')
                if image_info:
                    image_urls.append(image_info[0]['url'])

        # 處理分頁
        if 'continue' in data:
            params['gimcontinue'] = data['continue']['gimcontinue']
        else:
            break

    return image_urls

def _get_url_csv_path() -> Path:
    base_dir = Path(__file__).resolve().parent.parent  # data_factory/
    return base_dir / "url.csv"


def _ensure_directory(directory_path: Path) -> None:
    directory_path.mkdir(parents=True, exist_ok=True)


def _safe_filename_from_url(url: str) -> str:
    parsed = urlparse(url)
    name = Path(parsed.path).name
    if not name:
        # Fallback name when URL path has no basename
        name = "downloaded_file"
    return name


def _unique_target_path(directory_path: Path, desired_name: str) -> Path:
    candidate = directory_path / desired_name
    if not candidate.exists():
        return candidate

    stem = Path(desired_name).stem
    suffix = Path(desired_name).suffix
    counter = 1
    while True:
        new_name = f"{stem}({counter}){suffix}"
        candidate = directory_path / new_name
        if not candidate.exists():
            return candidate
        counter += 1


def _read_downloaded_urls(csv_path: Path) -> set:
    downloaded = set()
    if not csv_path.exists():
        return downloaded
    try:
        with csv_path.open("r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row:
                    continue
                downloaded.add(row[0])
    except Exception:
        # If the file is malformed, treat as empty to avoid blocking downloads
        return downloaded
    return downloaded


def _append_downloaded_urls(csv_path: Path, urls: list) -> None:
    if not urls:
        return
    # Ensure parent directory exists (it should, but be defensive)
    _ensure_directory(csv_path.parent)
    with csv_path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for url in urls:
            writer.writerow([url])


def download_files(url_list: list, target_folder: str) -> list:
    """
    Download files from the given URL list into the specified folder.

    - Skips URLs that have been downloaded before (tracked globally in url.csv)
    - Records newly downloaded URLs into url.csv
    - Ensures unique filenames in the target folder to avoid overwriting

    Args:
        url_list: List of file URLs to download.
        target_folder: Destination folder path.

    Returns:
        List of local file paths (as strings) successfully downloaded in this call.
    """
    csv_path = _get_url_csv_path()
    already_downloaded = _read_downloaded_urls(csv_path)

    destination_dir = Path(target_folder).expanduser().resolve()
    _ensure_directory(destination_dir)

    newly_downloaded_urls = []
    saved_file_paths = []

    with requests.Session() as session:
        for url in url_list:
            if url in already_downloaded:
                continue

            filename = _safe_filename_from_url(url)
            target_path = _unique_target_path(destination_dir, filename)

            try:
                response = session.get(url, stream=True, timeout=30)
                response.raise_for_status()
                with target_path.open("wb") as fp:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            fp.write(chunk)
                newly_downloaded_urls.append(url)
                saved_file_paths.append(str(target_path))
            except Exception:
                # Skip failures silently to keep batch going
                if target_path.exists():
                    try:
                        target_path.unlink()
                    except Exception:
                        pass
                continue

    # Persist only the URLs that were successfully downloaded in this run
    _append_downloaded_urls(csv_path, newly_downloaded_urls)

    return saved_file_paths


def _download_one(url: str, target_path: Path) -> bool:
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        with target_path.open("wb") as fp:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    fp.write(chunk)
        return True
    except Exception:
        if target_path.exists():
            try:
                target_path.unlink()
            except Exception:
                pass
        return False


async def async_download_files(
    url_list: list,
    target_folder: str,
    concurrency: int = 5,
    delay_between_starts: float = 0.0,
) -> list:
    """
    Asynchronously download files with limited concurrency and optional spacing between request starts.

    - Skips URLs recorded in url.csv (global dedupe)
    - Appends successfully downloaded URLs to url.csv
    - Ensures unique filenames per folder even under concurrency

    Args:
        url_list: List of file URLs to download.
        target_folder: Destination folder path.
        concurrency: Max number of concurrent downloads.
        delay_between_starts: Seconds to wait between starting each new download task.

    Returns:
        List of local file paths (as strings) successfully downloaded in this call.
    """
    csv_path = _get_url_csv_path()
    already_downloaded = _read_downloaded_urls(csv_path)

    destination_dir = Path(target_folder).expanduser().resolve()
    _ensure_directory(destination_dir)

    semaphore = asyncio.Semaphore(max(1, int(concurrency)))
    name_lock = asyncio.Lock()
    assigned_names = set()

    newly_downloaded_urls: list = []
    saved_file_paths: list = []
    tasks = []

    async def worker(url: str):
        if url in already_downloaded:
            return

        async with semaphore:
            # Allocate a unique target path under a lock to avoid races
            async with name_lock:
                desired_name = _safe_filename_from_url(url)
                candidate = destination_dir / desired_name
                if candidate.exists() or candidate.name in assigned_names:
                    stem = Path(desired_name).stem
                    suffix = Path(desired_name).suffix
                    counter = 1
                    while True:
                        new_name = f"{stem}({counter}){suffix}"
                        candidate = destination_dir / new_name
                        if not candidate.exists() and new_name not in assigned_names:
                            break
                        counter += 1
                assigned_names.add(candidate.name)
                target_path = candidate

            ok = await asyncio.to_thread(_download_one, url, target_path)
            if ok:
                newly_downloaded_urls.append(url)
                saved_file_paths.append(str(target_path))

    # Schedule tasks, optionally spacing their start times
    pending_urls = [u for u in url_list if u not in already_downloaded]
    for idx, url in enumerate(pending_urls):
        tasks.append(asyncio.create_task(worker(url)))
        if delay_between_starts > 0 and idx < len(pending_urls) - 1:
            await asyncio.sleep(delay_between_starts)

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

    _append_downloaded_urls(csv_path, newly_downloaded_urls)
    return saved_file_paths

def convert_all_image_into_webp(target_directory: Path, quality: int = 90, method: int = 6):
    '''
        Recursively process `target_directory` and all subdirectories.
        - If a file is an image and not in WEBP format, convert it to WEBP.
        - If a file is already WEBP, copy it as-is.
        - Outputs go into a sibling folder named "{target_directory.name}_webp".
        - Subfolder names are preserved (only the top-level folder name is changed).
        - If the top-level output folder already exists, raise FileExistsError and do nothing.

        Args:
            quality: WEBP quality (0-100). Default 90.
            method: WEBP encoder method/effort (0-6). Default 6 (slower, higher quality).

        Returns: list[str] of generated/copied file paths (absolute paths).
    '''

    if Image is None:
        raise RuntimeError(
            "Pillow is required to convert images to WEBP. Please install it: pip install pillow"
        )

    src_dir = Path(target_directory).expanduser().resolve()
    if not src_dir.exists() or not src_dir.is_dir():
        raise NotADirectoryError(f"Target directory does not exist or is not a directory: {src_dir}")

    dst_dir = src_dir.parent / f"{src_dir.name}_webp"
    if dst_dir.exists():
        raise FileExistsError(f"Destination already exists: {dst_dir}")
    dst_dir.mkdir(parents=True, exist_ok=False)

    image_suffixes = {
        ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff", ".webp", ".jfif", ".pjpeg", ".pjp",
    }

    # output_paths: list[str] = []

    for entry in src_dir.rglob("*"):
        if not entry.is_file():
            continue

        suffix = entry.suffix.lower()
        if suffix not in image_suffixes:
            continue

        # Mirror the directory structure under dst_dir, preserving subfolder names
        rel_parent = entry.parent.relative_to(src_dir)
        dest_parent_dir = dst_dir / rel_parent
        _ensure_directory(dest_parent_dir)

        # Determine destination filename and ensure uniqueness inside the subfolder
        if suffix == ".webp":
            desired_name = entry.name
        else:
            desired_name = f"{entry.stem}.webp"

        try:
            target_path = _unique_target_path(dest_parent_dir, desired_name)
        except Exception:
            target_path = dest_parent_dir / desired_name

        if suffix == ".webp":
            shutil.copy2(entry, target_path)
            # output_paths.append(str(target_path))
            continue

        try:
            with Image.open(entry) as img:
                try:
                    if getattr(img, "is_animated", False):
                        img.seek(0)
                except Exception:
                    pass

                has_palette_alpha = (img.mode == "P" and "transparency" in img.info)
                has_alpha = ("A" in (img.getbands() or ())) or has_palette_alpha
                convert_mode = "RGBA" if has_alpha else "RGB"
                converted = img.convert(convert_mode)

                save_params = {"format": "WEBP", "quality": int(quality), "method": int(method)}
                converted.save(target_path, **save_params)
                # output_paths.append(str(target_path))
        except UnidentifiedImageError:
            continue
        except Exception:
            if target_path.exists():
                try:
                    target_path.unlink()
                except Exception:
                    pass
            continue

    # return output_paths


def _convert_or_copy_to_webp_worker(args: Tuple[str, str, int, int]) -> Tuple[str, bool]:
    src_path_str, dst_path_str, quality, method = args
    src_path = Path(src_path_str)
    dst_path = Path(dst_path_str)

    try:
        dst_path.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

    suffix = src_path.suffix.lower()
    if suffix == ".webp":
        try:
            shutil.copy2(src_path, dst_path)
            return (dst_path_str, True)
        except Exception:
            return (dst_path_str, False)

    try:
        with Image.open(src_path) as img:
            try:
                if getattr(img, "is_animated", False):
                    img.seek(0)
            except Exception:
                pass

            has_palette_alpha = (img.mode == "P" and "transparency" in img.info)
            has_alpha = ("A" in (img.getbands() or ())) or has_palette_alpha
            convert_mode = "RGBA" if has_alpha else "RGB"
            converted = img.convert(convert_mode)

            save_params = {"format": "WEBP", "quality": int(quality), "method": int(method)}
            converted.save(dst_path, **save_params)
            return (dst_path_str, True)
    except UnidentifiedImageError:
        return (dst_path_str, False)
    except Exception:
        if dst_path.exists():
            try:
                dst_path.unlink()
            except Exception:
                pass
        return (dst_path_str, False)


def convert_all_image_into_webp_parallel(
    target_directory: Path,
    quality: int = 90,
    method: int = 6,
    max_workers: Optional[int] = None,
) -> List[str]:
    '''
        Parallel version using processes. Recursively mirrors folder structure under
        a top-level "{target_directory.name}_webp" directory. Only the top-level
        folder name is changed; subfolder names are preserved.

        - quality: WEBP quality (0-100), default 90
        - method: WEBP encoder effort (0-6), default 6 (slower, higher quality)
        - max_workers: number of worker processes (defaults to os.cpu_count())

        Returns: list[str] of generated/copied file paths (absolute paths).
    '''

    if Image is None:
        raise RuntimeError(
            "Pillow is required to convert images to WEBP. Please install it: pip install pillow"
        )

    src_dir = Path(target_directory).expanduser().resolve()
    if not src_dir.exists() or not src_dir.is_dir():
        raise NotADirectoryError(f"Target directory does not exist or is not a directory: {src_dir}")

    dst_dir = src_dir.parent / f"{src_dir.name}_webp"
    if dst_dir.exists():
        raise FileExistsError(f"Destination already exists: {dst_dir}")
    dst_dir.mkdir(parents=True, exist_ok=False)

    image_suffixes = {
        ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff", ".webp", ".jfif", ".pjpeg", ".pjp",
    }

    # Precompute unique destination paths per subfolder to avoid name races
    assigned_names_per_dir: dict[Path, set[str]] = {}
    tasks: List[Tuple[str, str, int, int]] = []

    for entry in src_dir.rglob("*"):
        if not entry.is_file():
            continue
        if entry.suffix.lower() not in image_suffixes:
            continue

        rel_parent = entry.parent.relative_to(src_dir)
        dest_parent_dir = dst_dir / rel_parent

        desired_name = entry.name if entry.suffix.lower() == ".webp" else f"{entry.stem}.webp"

        used = assigned_names_per_dir.setdefault(dest_parent_dir, set())
        candidate_name = desired_name
        if candidate_name in used:
            stem = Path(desired_name).stem
            suffix = Path(desired_name).suffix
            counter = 1
            while True:
                new_name = f"{stem}({counter}){suffix}"
                if new_name not in used:
                    candidate_name = new_name
                    break
                counter += 1
        used.add(candidate_name)

        final_dst = dest_parent_dir / candidate_name
        tasks.append((str(entry), str(final_dst), int(quality), int(method)))

    if not tasks:
        return []

    # Ensure all destination directories exist to reduce mkdir contention
    for dest_parent in assigned_names_per_dir.keys():
        try:
            dest_parent.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass

    worker_count = max_workers or os.cpu_count() or 1
    results: List[str] = []
    with ProcessPoolExecutor(max_workers=worker_count) as executor:
        future_to_dst = {executor.submit(_convert_or_copy_to_webp_worker, t): t[1] for t in tasks}
        for future in as_completed(future_to_dst):
            dst_path_str = future_to_dst[future]
            try:
                _, ok = future.result()
                if ok:
                    results.append(dst_path_str)
            except Exception:
                # Ignore failures to keep batch going
                pass

    # return results




# if __name__ == "__main__":
#     page_title = "Street_Fighter_6/Zangief"
#     urls = get_all_image_urls(page_title)
#     for url in urls:
#         print(url)