# backend/src/ml/scrape_fighter_outcomes.py

import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from src.db import SessionLocal, Fighter
from sqlalchemy import text
import time
import re

# 🧠 Utility to clean and normalize text
def clean(text):
    return re.sub(r"\s+", " ", text.strip()) if text else None

# 🔍 Extract fight outcomes from one fighter's UFCStats profile
def scrape_fighter_outcomes(url: str, fighter_name: str):
    print(f"🔍 Scraping {fighter_name} ({url})")
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    table_rows = soup.select("table.b-fight-details__table tbody tr")
    results = []

    for row in table_rows:
        cols = row.select("td")
        if len(cols) < 10:
            continue

        result = clean(cols[0].text).lower()

        # ✅ Get opponent name by comparing both fighter names in the column
        name_links = cols[1].select("a")
        if len(name_links) < 2:
            opponent = "Unknown"
        else:
            name_a = name_links[0].text.strip()
            name_b = name_links[1].text.strip()
            opponent = name_b if name_a == fighter_name else name_a

        event = clean(cols[6].text)
        method = clean(cols[7].text)
        round_ = clean(cols[8].text)
        time_ = clean(cols[9].text)

        # 🗓️ Extract event date from second <p> tag inside event column
        event_p_tags = cols[6].select("p")
        if len(event_p_tags) >= 2:
            date_text = clean(event_p_tags[1].text)
        else:
            date_text = None

        match = re.search(r"[A-Za-z]{3}\.?\s\d{2},\s\d{4}", date_text or "")
        date = match.group() if match else None

        results.append({
            "fighter_name": fighter_name,
            "opponent_name": opponent,
            "result": result,
            "method": method,
            "round": round_,
            "time": time_,
            "event": event,
            "event_date": date,
        })

    return results

# 💾 Save outcomes to database
def save_outcomes(db: Session, outcomes):
    if not outcomes:
        return

    fighter_name = outcomes[0]["fighter_name"]
    db.execute(text("DELETE FROM fight_results WHERE fighter_name = :name"), {"name": fighter_name})
    db.commit()

    for fight in outcomes:
        db.execute(text("""
            INSERT INTO fight_results (
                fighter_name, opponent_name, result, method, round, time, event, event_date
            ) VALUES (
                :fighter_name, :opponent_name, :result, :method, :round, :time, :event, :event_date
            )
        """), fight)
    db.commit()

# 🚀 Main loop to scrape all fighters
def scrape_all_fighters():
    db = SessionLocal()

    # Ensure the fight_results table exists
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS fight_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fighter_name TEXT,
            opponent_name TEXT,
            result TEXT,
            method TEXT,
            round TEXT,
            time TEXT,
            event TEXT,
            event_date TEXT
        )
    """))
    db.commit()

    fighters = db.query(Fighter).all()
    for fighter in fighters:
        if not fighter.profile_url:
            continue

        try:
            outcomes = scrape_fighter_outcomes(fighter.profile_url, fighter.name)
            save_outcomes(db, outcomes)
            time.sleep(0.5)  # Be polite to the server
        except Exception as e:
            print(f"❌ Failed to scrape {fighter.name}: {e}")

    db.close()
    print("✅ Finished scraping all fighters.")

if __name__ == "__main__":
    scrape_all_fighters()
