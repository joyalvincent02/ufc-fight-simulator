# backend/src/ml/scrape_fighter_outcomes.py

import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from src.db import (
    SessionLocal,
    Fighter,
    ModelPrediction,
    upsert_fight_result,
)
from sqlalchemy import text
import time
import re
from datetime import datetime

# 🧠 Utility to clean and normalize text
def clean(text):
    return re.sub(r"\s+", " ", text.strip()) if text else None

# Extract fight outcomes from one fighter's UFCStats profile
def scrape_fighter_outcomes(url: str, fighter_name: str):
    print(f"Scraping {fighter_name} ({url})")
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    table_rows = soup.select("table.b-fight-details__table tbody tr")
    results = []

    for row in table_rows:
        cols = row.select("td")
        if len(cols) < 10:
            continue

        result = clean(cols[0].text).lower()

        # Get opponent name by comparing both fighter names in the column
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

# 💾 Save outcomes to database and update predictions
def save_outcomes(db: Session, outcomes):
    if not outcomes:
        return

    fighter_name = outcomes[0]["fighter_name"]
    
    # Save to fight_results table (using existing schema)
    for fight in outcomes:
        try:
            upsert_fight_result(
                db,
                fighter_name=fight["fighter_name"],
                opponent_name=fight["opponent_name"],
                result=fight["result"],
                event=fight["event"],
                event_date=fight["event_date"],
                method=fight["method"],
                round=fight["round"],
                time=fight["time"],
            )

            inverse_result = None
            if fight["result"] == "win":
                inverse_result = "loss"
            elif fight["result"] == "loss":
                inverse_result = "win"
            else:
                inverse_result = fight["result"]

            upsert_fight_result(
                db,
                fighter_name=fight["opponent_name"],
                opponent_name=fight["fighter_name"],
                result=inverse_result,
                event=fight["event"],
                event_date=fight["event_date"],
                method=fight["method"],
                round=fight["round"],
                time=fight["time"],
            )
            
            # Determine the actual winner for predictions
            if fight["result"] == "win":
                actual_winner = fighter_name
            elif fight["result"] == "loss": 
                actual_winner = fight["opponent_name"]
            else:
                actual_winner = "Draw"
            
            # Update any matching predictions
            predictions = db.query(ModelPrediction).filter(
                ((ModelPrediction.fighter_a == fighter_name) & (ModelPrediction.fighter_b == fight["opponent_name"])) |
                ((ModelPrediction.fighter_a == fight["opponent_name"]) & (ModelPrediction.fighter_b == fighter_name))
            ).all()
            
            for pred in predictions:
                pred.actual_winner = actual_winner
                pred.correct = (pred.predicted_winner == actual_winner)

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Failed to save fight result for {fight['fighter_name']} vs {fight['opponent_name']}: {e}")

# Main loop to scrape all fighters
def scrape_all_fighters():
    db = SessionLocal()

    fighters = db.query(Fighter).all()
    for fighter in fighters:
        if not fighter.profile_url:
            continue

        try:
            outcomes = scrape_fighter_outcomes(fighter.profile_url, fighter.name)
            save_outcomes(db, outcomes)
            time.sleep(0.5)  # Be polite to the server
        except Exception as e:
            print(f"Failed to scrape {fighter.name}: {e}")

    db.close()
    print("Finished scraping all fighters and updating predictions.")

if __name__ == "__main__":
    scrape_all_fighters()
