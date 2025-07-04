# backend/src/ml/update_fighter_profiles.py

from src.db import SessionLocal, Fighter
from src.fighter_scraper import scrape_fighter_stats, save_fighter_to_db
import time

def update_all_fighters():
    db = SessionLocal()
    fighters = db.query(Fighter).all()
    db.close()

    for fighter in fighters:
        if not fighter.profile_url:
            continue

        data = scrape_fighter_stats(fighter.name, fighter.profile_url)
        if data:
            save_fighter_to_db(data)
            time.sleep(0.5)  # be polite to the site

    print("✅ Finished updating fighter profiles.")

if __name__ == "__main__":
    update_all_fighters()
