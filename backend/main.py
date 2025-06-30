from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.fight_model import calculate_exchange_probabilities
from src.simulate_fight import simulate_fight
from src.ufc_scraper import get_upcoming_event_links
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