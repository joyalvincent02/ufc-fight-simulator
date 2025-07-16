import requests
from bs4 import BeautifulSoup
from src.db import Fighter, SessionLocal
from datetime import datetime

def parse_dob(text):
    try:
        return datetime.strptime(text.strip(), "%b %d, %Y").date()
    except Exception as e:
        print(f"Failed to parse DOB: {text} — {e}")
        return None


def scrape_fighter_stats(name: str, profile_url: str):
    response = requests.get(profile_url)
    soup = BeautifulSoup(response.text, "html.parser")

    def extract_stat(label_keyword):
        stat_section = soup.find("div", class_="b-list__info-box-left")
        if not stat_section:
            print("Could not find stat section.")
            return None

        for li in stat_section.find_all("li"):
            text = li.get_text(strip=True)
            if label_keyword.lower() in text.lower():
                value_part = text.split(":")[-1].strip()
                if value_part == "--":
                    return None
                try:
                    return float(value_part.replace("%", "")) / 100 if "%" in value_part else float(value_part)
                except ValueError:
                    return None
        return None

    def extract_profile_details():
        details = {"height": None, "weight": None, "reach": None, "stance": None, "dob": None}
        info_box = soup.select_one("div.b-list__info-box_style_small-width")
        if not info_box:
            return details

        for li in info_box.select("li"):
            text = li.get_text(":", strip=True)
            if "Height:" in text:
                details["height"] = text.split(":")[-1].strip()
            elif "Weight:" in text:
                details["weight"] = text.split(":")[-1].strip()
            elif "Reach:" in text:
                details["reach"] = text.split(":")[-1].strip()
            elif "STANCE:" in text:
                details["stance"] = text.split(":")[-1].strip()
            elif "DOB:" in text:
                details["dob"] = text.split(":")[-1].strip()
        return details

    def extract_image_url():
        img_tag = soup.find("img", class_="c-hero__image")
        return img_tag["src"] if img_tag and img_tag.get("src") else None

    try:
        profile = extract_profile_details()

        stats = {
            "name": name,
            "profile_url": profile_url,
            "image_url": extract_image_url(),
            "slpm": extract_stat("SLpM"),
            "str_acc": extract_stat("Str. Acc"),
            "str_def": extract_stat("Str. Def"),
            "td_avg": extract_stat("TD Avg"),
            "td_acc": extract_stat("TD Acc"),
            "td_def": extract_stat("TD Def"),
            "sub_avg": extract_stat("Sub. Avg"),
            "height": profile["height"],
            "weight": profile["weight"],
            "reach": profile["reach"],
            "stance": profile["stance"],
            "dob": parse_dob(profile["dob"]),
            "last_updated": datetime.utcnow()
        }

        required = ["slpm", "str_acc", "str_def", "td_avg", "td_acc", "td_def", "sub_avg"]
        if any(stats[k] is None for k in required):
            print(f"Incomplete data for {name}, skipping.")
            return None

    except Exception as e:
        print(f"Error parsing stats for {name}: {e}")
        return None

    return stats

def save_fighter_to_db(fighter_data):
    db = SessionLocal()
    existing = db.query(Fighter).filter(Fighter.name == fighter_data["name"]).first()

    if existing:
        for key, value in fighter_data.items():
            if hasattr(existing, key) and value and getattr(existing, key) != value:
                setattr(existing, key, value)
        db.commit()
        print(f"🔁 Updated {fighter_data['name']}.")
    else:
        fighter = Fighter(**fighter_data)
        db.add(fighter)
        db.commit()
        print(f"{fighter.name} added to DB.")
    db.close()
