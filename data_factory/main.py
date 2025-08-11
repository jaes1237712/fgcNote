import requests
import os

def download_character_images(character_list, base_url_pattern, output_directory="downloaded_images"):
    """
    下載指定角色列表的圖片。

    Args:
        character_list (list): 包含角色名稱（字串）的列表。
        base_url_pattern (str): 圖片網址的模板，使用 {character} 作為佔位符。
                                例如："https://www.streetfighter.com/6/assets/images/character/{character}/bg_{character}.jpg"
        output_directory (str): 圖片下載後儲存的資料夾名稱。預設為 "downloaded_images"。
    """

    # 確保輸出資料夾存在，如果不存在則創建
    os.makedirs(output_directory, exist_ok=True)
    print(f"圖片將儲存到資料夾: {os.path.abspath(output_directory)}\n")

    for character in character_list:
        # 1. 構建完整的圖片網址
        image_url = base_url_pattern.format(character=character)
        
        # 2. 構建本地儲存的檔案名稱
        # 檔案名為 bg_{character}.jpg
        file_name = f"bg_{character}.jpg"
        # 完整的本地檔案路徑
        local_file_path = os.path.join(output_directory, file_name)

        print(f"嘗試下載 {character} 的圖片...")
        print(f"  URL: {image_url}")
        print(f"  儲存為: {local_file_path}")

        try:
            # 3. 發送 HTTP GET 請求下載圖片
            # stream=True 允許大檔案下載而不會一次性載入到記憶體
            response = requests.get(image_url, stream=True)
            response.raise_for_status()  # 如果 HTTP 請求返回錯誤狀態碼 (例如 404, 500)，則引發異常

            # 4. 將圖片內容寫入檔案
            with open(local_file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ 成功下載並儲存 {character} 的圖片。")

        except requests.exceptions.RequestException as e:
            print(f"❌ 下載 {character} 的圖片失敗: {e}")
        except Exception as e:
            print(f"❌ 處理 {character} 的圖片時發生意外錯誤: {e}")
        
        print("-" * 30) # 分隔線，讓輸出更清晰

def main():
    print("Hello from data-factory!")

if __name__ == "__main__":
    main()
