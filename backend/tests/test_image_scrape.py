import requests
from bs4 import BeautifulSoup

def get_fighter_image_url(ufc_url: str):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/122.0.0.0 Safari/537.36"
        }
        response = requests.get(ufc_url, headers=headers)
        if response.status_code != 200:
            print(f"❌ Error: {response.status_code}")
            return None
        soup = BeautifulSoup(response.text, 'html.parser')
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            return og_image["content"]
        print("⚠️ og:image meta tag not found.")
        return None
    except Exception as e:
        print(f"⚠️ Could not retrieve image from {ufc_url}: {e}")
        return None

# Test the function
if __name__ == "__main__":
    url = "https://www.ufc.com/athlete/derrick-lewis"
    image_url = get_fighter_image_url(url)
    if image_url:
        print(f"✅ Found image URL: {image_url}")
    else:
        print("❌ Failed to retrieve image URL.")
