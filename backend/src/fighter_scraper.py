import requests
from bs4 import BeautifulSoup
from db import Fighter, SessionLocal
from datetime import datetime

def scrape_fighter_stats(name: str, profile_url: str):
    response = requests.get(profile_url)
    soup = BeautifulSoup(response.text, "html.parser")

    def extract_stat(label_keyword):
        stat_section = soup.find("div", class_="b-list__info-box-left")
        if not stat_section:
            print("❌ Could not find stat section.")
            return None

        for li in stat_section.find_all("li"):
            text = li.get_text(strip=True)
            if label_keyword.lower() in text.lower():
                value_part = text.split(":")[-1].strip()
                if value_part == "--":
                    print(f"Missing stat: {label_keyword}")
                    return None
                try:
                    return float(value_part.replace("%", "")) / 100 if "%" in value_part else float(value_part)
                except ValueError:
                    print(f"Error parsing: {label_keyword} → '{value_part}'")
                    return None

        print(f"Label not found: {label_keyword}")
        return None

    try:
        stats = {
            "name": name,
            "profile_url": profile_url,
            "slpm": extract_stat("SLpM"),
            "str_acc": extract_stat("Str. Acc"),
            "str_def": extract_stat("Str. Def"),
            "td_avg": extract_stat("TD Avg"),
            "td_acc": extract_stat("TD Acc"),
            "td_def": extract_stat("TD Def"),
            "sub_avg": extract_stat("Sub. Avg"),
            "last_updated": datetime.utcnow()
        }

        # Ensure all required stats are present
        required = ["slpm", "str_acc", "str_def", "td_avg", "td_acc", "td_def", "sub_avg"]
        if any(stats[k] is None for k in required):
            print(f"❌ Incomplete data for {name}, skipping.")
            return None

    except Exception as e:
        print(f"Error parsing stats for {name}: {e}")
        return None

    return stats


def save_fighter_to_db(fighter_data):
    db = SessionLocal()
    existing = db.query(Fighter).filter(Fighter.name == fighter_data["name"]).first()

    if existing:
        print(f"{fighter_data['name']} already in DB — skipping insert.")
    else:
        fighter = Fighter(**fighter_data)
        db.add(fighter)
        db.commit()
        print(f"✅ {fighter.name} added to DB.")

    db.close()
