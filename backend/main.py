from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from src.fight_model import calculate_exchange_probabilities
from src.simulate_fight import simulate_fight
from src.ufc_scraper import get_upcoming_event_links
from src.ufc_scraper import get_fight_card
from src.fighter_scraper import scrape_fighter_stats, save_fighter_to_db
from src.db import SessionLocal, Fighter
from types import SimpleNamespace
from bs4 import BeautifulSoup
from pydantic import BaseModel
import requests
import re

import json
import os
from dotenv import load_dotenv
load_dotenv()

def to_stats_obj(d):
    return SimpleNamespace(**d)

app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
print("🔧 ALLOWED_ORIGINS =", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def name_to_slug(name: str) -> str:
    return name.lower().replace(" ", "-")

def get_fighter_image_url(name: str) -> str | None:
    slug = name_to_slug(name)
    url = f"https://www.ufc.com/athlete/{slug}"

    print(f"🌐 Fetching UFC profile: {url}")
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        )
    }

    try:
        res = requests.get(url, headers=headers, timeout=10)
        print(f"📡 Response status: {res.status_code}")
        if res.status_code != 200:
            return None

        soup = BeautifulSoup(res.text, "html.parser")

        # Try og:image first
        meta_tag = soup.find("meta", property="og:image")
        if meta_tag and meta_tag.get("content"):
            print(f"✅ og:image found: {meta_tag['content']}")
            return meta_tag["content"]

        # Try fallback with image src match
        img_tag = soup.find("img", {"src": re.compile(r"/images/styles/event_results_athlete_headshot")})
        if img_tag:
            src = img_tag["src"]
            print(f"✅ fallback image found: {src}")
            return "https://ufc.com" + src if src.startswith("/") else src

    except Exception as e:
        print(f"❌ Exception while scraping image: {e}")

    print("⚠️ No image found.")
    return None


@app.get("/fighters")
def list_fighters():
    db = SessionLocal()
    fighters = db.query(Fighter).order_by(Fighter.name).all()
    db.close()
    return [{"name": f.name, "image": f.image_url} for f in fighters]

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
    event_url = f"http://ufcstats.com/event-details/{event_id}"
    print(f"🔍 Scraping card from: {event_url}")

    card = get_fight_card(event_url)
    if not card:
        return {"error": f"No fight card found at {event_url}"}

    db = SessionLocal()
    fight_results = []

    for fight in card:
        name_a = fight["fighter_a"]
        name_b = fight["fighter_b"]
        url_a = fight["url_a"]
        url_b = fight["url_b"]

        # Fetch or scrape Fighter A
        fighter_a = db.query(Fighter).filter(Fighter.name == name_a).first()
        if not fighter_a:
            stats = scrape_fighter_stats(name_a, url_a)
            if stats:
                image_url = get_fighter_image_url(name_a)
                if image_url:
                    stats["image_url"] = image_url
                save_fighter_to_db(stats)
                fighter_a = db.query(Fighter).filter(Fighter.name == name_a).first()


        # Fetch or scrape Fighter B
        fighter_b = db.query(Fighter).filter(Fighter.name == name_b).first()
        if not fighter_b:
            stats = scrape_fighter_stats(name_b, url_b)
            if stats:
                image_url = get_fighter_image_url(name_b)
                if image_url:
                    stats["image_url"] = image_url
                save_fighter_to_db(stats)
                fighter_b = db.query(Fighter).filter(Fighter.name == name_b).first()


        if fighter_a and fighter_b:
            P_A, P_B, P_neutral = calculate_exchange_probabilities(fighter_a, fighter_b)
            results = simulate_fight(P_A, P_B, P_neutral, 5, name_A=name_a, name_B=name_b)

            fight_results.append({
                "fighters": [
                    {"name": name_a, "image": fighter_a.image_url},
                    {"name": name_b, "image": fighter_b.image_url}
                ],
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
        "event": f"Event ID {event_id}",
        "fights": fight_results
    }


@app.post("/refresh-images")
def refresh_fighter_images():
    db = SessionLocal()
    fighters = db.query(Fighter).all()
    updated = 0
    skipped = 0

    for fighter in fighters:
        image_url = get_fighter_image_url(fighter.name)
        if image_url:
            if fighter.image_url != image_url:
                fighter.image_url = image_url
                updated += 1
            else:
                skipped += 1
        else:
            print(f"⚠️ Could not fetch image for {fighter.name}")

    db.commit()
    db.close()
    return {
        "updated": updated,
        "skipped": skipped,
        "total": len(fighters)
    }

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

class CustomSimRequest(BaseModel):
    fighter_a: str
    fighter_b: str

@app.post("/simulate-custom")
def simulate_custom_fight(req: CustomSimRequest):
    db = SessionLocal()
    name_a = req.fighter_a.strip()
    name_b = req.fighter_b.strip()

    fighter_a = db.query(Fighter).filter(Fighter.name == name_a).first()
    fighter_b = db.query(Fighter).filter(Fighter.name == name_b).first()
    db.close()

    if fighter_a and fighter_b:
        P_A, P_B, P_neutral = calculate_exchange_probabilities(fighter_a, fighter_b)
        results = simulate_fight(P_A, P_B, P_neutral, 5, name_A=name_a, name_B=name_b)
        return {
            "fighters": [
                {"name": name_a, "image": fighter_a.image_url},
                {"name": name_b, "image": fighter_b.image_url}
            ],
            "probabilities": {"P_A": P_A, "P_B": P_B, "P_neutral": P_neutral},
            "results": results
        }

    return {"error": "One or both fighters not found in the database."}