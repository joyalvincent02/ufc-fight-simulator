from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.fight_model import calculate_exchange_probabilities
from src.simulate_fight import simulate_fight
from src.ufc_scraper import get_upcoming_event_links
from src.ufc_scraper import get_fight_card
from src.fighter_scraper import scrape_fighter_stats, save_fighter_to_db
from src.db import SessionLocal, Fighter
from types import SimpleNamespace
from bs4 import BeautifulSoup
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

def get_fighter_image_url(ufc_url: str):
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            )
        }
        response = requests.get(ufc_url, headers=headers)
        if response.status_code != 200:
            print(f"❌ Error fetching {ufc_url}: Status {response.status_code}")
            return None

        soup = BeautifulSoup(response.text, 'html.parser')

        # Try og:image first
        meta_tag = soup.find("meta", property="og:image")
        if meta_tag and meta_tag.get("content"):
            print(f"✅ Found image via og:image: {meta_tag['content']}")
            return meta_tag["content"]

        # Fallback to image in header (new format)
        img_tag = soup.select_one("div.c-hero__image img")
        if img_tag and img_tag.get("src"):
            print(f"✅ Found image via fallback tag: {img_tag['src']}")
            return img_tag["src"]

        print(f"⚠️ No image found in {ufc_url}")
        return None

    except Exception as e:
        print(f"⚠️ Could not retrieve image from {ufc_url}: {e}")
        return None


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

        # Fetch or scrape Fighter A
        fighter_a = db.query(Fighter).filter(Fighter.name == name_a).first()
        if not fighter_a:
            stats = scrape_fighter_stats(name_a, url_a)
            if stats:
                ufc_com_url = f"https://www.ufc.com/athlete/{name_a.lower().replace(' ', '-')}"
                image_url = get_fighter_image_url(ufc_com_url)
                if image_url:
                    stats["image_url"] = image_url
                save_fighter_to_db(stats)
                fighter_a = db.query(Fighter).filter(Fighter.name == name_a).first()
        elif not fighter_a.image_url:
            # Update image_url if missing
            image_url = get_fighter_image_url(url_a)
            if image_url:
                fighter_a.image_url = image_url
                db.commit()

        # Fetch or scrape Fighter B
        fighter_b = db.query(Fighter).filter(Fighter.name == name_b).first()
        if not fighter_b:
            stats = scrape_fighter_stats(name_b, url_b)
            if stats:
                ufc_com_url = f"https://www.ufc.com/athlete/{name_b.lower().replace(' ', '-')}"
                image_url = get_fighter_image_url(ufc_com_url)
                if image_url:
                    stats["image_url"] = image_url
                save_fighter_to_db(stats)
                fighter_b = db.query(Fighter).filter(Fighter.name == name_b).first()
        elif not fighter_b.image_url:
            image_url = get_fighter_image_url(url_b)
            if image_url:
                fighter_b.image_url = image_url
                db.commit()

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
        "event": event["title"],
        "fights": fight_results
    }

@app.post("/refresh-images")
def refresh_fighter_images():
    db = SessionLocal()
    fighters = db.query(Fighter).all()
    updated = 0
    skipped = 0

    for fighter in fighters:
        ufc_com_url = f"https://www.ufc.com/athlete/{fighter.name.lower().replace(' ', '-')}"
        image_url = get_fighter_image_url(ufc_com_url)

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