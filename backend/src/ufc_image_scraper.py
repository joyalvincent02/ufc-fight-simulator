import requests
from bs4 import BeautifulSoup
import re

def name_to_slug(name: str) -> str:
    """
    Convert 'Max Holloway' -> 'max-holloway'
    """
    return name.lower().replace(" ", "-")

def get_fighter_image_url(name: str) -> str | None:
    """
    Scrapes UFC.com to get the fighter's headshot image URL.
    """
    slug = name_to_slug(name)
    url = f"https://ufc.com/athlete/{slug}"

    headers = {
        "User-Agent": "Mozilla/5.0",
    }

    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            return None

        soup = BeautifulSoup(res.text, "html.parser")
        img_tag = soup.find("img", {"src": re.compile(r"/images/styles/event_results_athlete_headshot")})
        if img_tag:
            img_url = img_tag["src"]
            if img_url.startswith("/"):
                return "https://ufc.com" + img_url
            return img_url

    except Exception:
        return None

    return None
