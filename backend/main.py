from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.fight_model import calculate_exchange_probabilities
from src.simulate_fight import simulate_fight
from src.ufc_scraper import get_upcoming_event_links
from src.ufc_scraper import get_fight_card
from src.fighter_scraper import scrape_fighter_stats, save_fighter_to_db
from src.db import SessionLocal, Fighter
from types import SimpleNamespace

import json
import os

def to_stats_obj(d):
    return SimpleNamespace(**d)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulate endpoint
@app.get("/simulate/{event_id}")
def simulate_event(event_id: str):
    json_path = f"data/{event_id}.json"
    
    if not os.path.exists(json_path):
        return {"error": f"No data file for event ID {event_id}"}

    with open(json_path, "r") as file:
        data = json.load(file)

    stats_A = to_stats_obj(data["FighterA"])
    stats_B = to_stats_obj(data["FighterB"])

    name_A = stats_A.name
    name_B = stats_B.name   

    P_A, P_B, P_neutral = calculate_exchange_probabilities(stats_A, stats_B)

    results = simulate_fight(P_A, P_B, P_neutral, num_rounds=5, name_A=name_A, name_B=name_B)

    return {
        "fighters": [name_A, name_B],
        "probabilities": {"P_A": P_A, "P_B": P_B, "P_neutral": P_neutral},
        "results": results,
    }

@app.get("/events")
def list_upcoming_events():
    try:
        raw_events = get_upcoming_event_links()

        events = []
        for e in raw_events:
            event_id = e["url"].split("/")[-1]
            events.append({
                "id": event_id,
                "name": e["title"],
                "url": e["url"]
            })

        return events
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/simulate-event/{event_id}")
def simulate_full_event(event_id: str):
    # Step 1: get full event URL from upcoming list
    upcoming = get_upcoming_event_links()
    event = next((e for e in upcoming if e["url"].split("/")[-1] == event_id), None)

    if not event:
        return {"error": f"Event ID {event_id} not found in upcoming events"}

    card = get_fight_card(event["url"])
    db = SessionLocal()
    fight_results = []

    for fight in card:
        name_a = fight["fighter_a"]
        name_b = fight["fighter_b"]
        url_a = fight["url_a"]
        url_b = fight["url_b"]

        # Load or scrape fighter A
        fighter_a = db.query(Fighter).filter(Fighter.name == name_a).first()
        if not fighter_a:
            stats = scrape_fighter_stats(name_a, url_a)
            if stats:
                save_fighter_to_db(stats)
                fighter_a = db.query(Fighter).filter(Fighter.name == name_a).first()

        # Load or scrape fighter B
        fighter_b = db.query(Fighter).filter(Fighter.name == name_b).first()
        if not fighter_b:
            stats = scrape_fighter_stats(name_b, url_b)
            if stats:
                save_fighter_to_db(stats)
                fighter_b = db.query(Fighter).filter(Fighter.name == name_b).first()

        # If both fighters are available, simulate
        if fighter_a and fighter_b:
            P_A, P_B, P_neutral = calculate_exchange_probabilities(fighter_a, fighter_b)
            results = simulate_fight(P_A, P_B, P_neutral, 5, name_A=name_a, name_B=name_b)
            fight_results.append({
                "fighters": [name_a, name_b],
                "probabilities": {"P_A": P_A, "P_B": P_B, "P_neutral": P_neutral},
                "results": results
            })
        else:
            fight_results.append({
                "fighters": [name_a, name_b],
                "error": "Missing fighter stats"
            })

    db.close()

    return {
        "event": event["title"],
        "fights": fight_results
    }