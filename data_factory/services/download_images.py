import os
import requests
from urllib.parse import urlparse

def download_url_to_path(url, output_directory="/home/hung/fgcNote/data_factory/download", **kwargs):
    """
    下載指定 URL 的圖片到指定的路徑。

    Args:
        url (str): 圖片的完整網址。
        output_directory (str): 圖片下載後儲存的資料夾路徑。
                                預設為 "/home/hung/fgcNote/data_factory/download"。
        **kwargs: 額外參數，可包含 'file_name' (指定檔案名) 或 'default_extension' (預設副檔名)。
    Returns:
        str or None: 如果成功，返回儲存圖片的完整路徑；否則返回 None。
    """

    # 確保輸出資料夾存在，如果不存在則創建
    try:
        os.makedirs(output_directory, exist_ok=True)
        print(f"圖片將儲存到資料夾: {os.path.abspath(output_directory)}\n")
    except OSError as e:
        print(f"❌ 無法創建輸出資料夾 '{output_directory}': {e}")
        return None

    # 從 kwargs 獲取指定檔案名 (如果有的話)
    explicit_file_name = kwargs.get('file_name', None)

    # 從 URL 提取可能的原始檔案名和副檔名
    parsed_url = urlparse(url)
    url_base_name = os.path.basename(parsed_url.path)
    _, url_extension = os.path.splitext(url_base_name)
    
    # 確定最終的檔案名稱 (不帶路徑)
    file_name = ""
    if explicit_file_name:
        file_name = explicit_file_name
        _, explicit_extension = os.path.splitext(explicit_file_name)
        if not explicit_extension:
            if url_extension:
                file_name += url_extension
            else:
                default_ext = kwargs.get('default_extension', '.jpg')
                if not default_ext.startswith('.'): default_ext = '.' + default_ext
                file_name += default_ext
                print(f"⚠️ 指定的檔案名 '{explicit_file_name}' 無副檔名，已自動加上預設副檔名 '{file_name}'")
    else:
        file_name = url_base_name
        if not url_extension:
            default_ext = kwargs.get('default_extension', '.jpg')
            if not default_ext.startswith('.'): default_ext = '.' + default_ext
            
            if not file_name or file_name.endswith('/'):
                file_name = "downloaded_image" + default_ext
                print(f"⚠️ 無法從 URL '{url}' 推斷出有效的檔案名稱，已使用預設名稱 '{file_name}'")
            else:
                file_name += default_ext
                print(f"⚠️ URL 推斷的檔案名 '{url_base_name}' 無副檔名，已自動加上預設副檔名 '{file_name}'")

    if not file_name:
        default_ext = kwargs.get('default_extension', '.jpg')
        if not default_ext.startswith('.'): default_ext = '.' + default_ext
        file_name = "downloaded_image" + default_ext
        print(f"⚠️ 檔案名稱處理異常，已回退到預設名稱 '{file_name}'")


    # 完整的本地檔案路徑
    local_file_path = os.path.join(output_directory, file_name)

    print(f"嘗試下載圖片...")
    print(f"  URL: {url}")
    print(f"  儲存為: {local_file_path}")

    # ------------------------------------

    try:
        # 發送 HTTP GET 請求下載圖片，並帶上 headers
        response = requests.get(url, stream=True)
        response.raise_for_status()  # 如果 HTTP 請求返回錯誤狀態碼 (例如 404, 500)，則引發異常

        # 將圖片內容寫入檔案
        with open(local_file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"✅ 成功下載並儲存圖片到 {local_file_path}。")
        return local_file_path

    except requests.exceptions.RequestException as e:
        print(f"❌ 下載圖片失敗: {e}")
    except Exception as e:
        print(f"❌ 處理圖片時發生意外錯誤: {e}")
    
    return None

# --- 範例用法 ---
if __name__ == "__main__":
    # 測試下載 Street Fighter 圖片
    sf6_image_url = "https://www.streetfighter.com/6/assets/images/character/cammy/bg_cammy.jpg"
    
    print("--- 測試 Street Fighter 圖片下載 (帶 Headers) ---")
    downloaded_path = download_url_to_path(sf6_image_url)
    if downloaded_path:
        print(f"圖片已下載到: {downloaded_path}")
    else:
        print("圖片下載失敗。")

    print("\n" + "="*50 + "\n")

    # 測試一個普通的可下載圖片 URL (不應該需要特別的 Headers)
    test_image_url_normal = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
    print("--- 測試普通圖片下載 ---")
    download_url_to_path(test_image_url_normal)