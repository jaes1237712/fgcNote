import requests
from pathlib import Path
from urllib.parse import urlparse
import csv
import asyncio

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


# if __name__ == "__main__":
#     page_title = "Street_Fighter_6/Zangief"
#     urls = get_all_image_urls(page_title)
#     for url in urls:
#         print(url)