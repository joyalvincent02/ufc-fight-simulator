# backend/main.py
from fastapi import FastAPI, Query, Body, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.fight_model import calculate_exchange_probabilities
from src.simulate_fight import simulate_fight
from src.ufc_scraper import get_upcoming_event_links, get_completed_event_links, get_fight_card, _scraper as _ufc_scraper
from src.fighter_scraper import scrape_fighter_stats, save_fighter_to_db
from src.db import SessionLocal, Fighter, ModelPrediction, FightResult
from src.ensemble_predict import get_ensemble_prediction
from src.ufc_scheduler import start_scheduler, stop_scheduler, get_scheduler
import math
import time
from zoneinfo import ZoneInfo
from types import SimpleNamespace
from bs4 import BeautifulSoup
from sqlalchemy import func, or_, and_, case
from datetime import datetime, date, timedelta, timezone
import requests
import re
import json
import os
import secrets
import traceback
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Admin auth
# ---------------------------------------------------------------------------
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")

def verify_admin_key(x_admin_key: str = Header(None)):
    """Dependency that enforces the X-Admin-Key header on sensitive endpoints."""
    if not ADMIN_SECRET:
        raise HTTPException(status_code=500, detail="Admin secret not configured on the server")
    if not x_admin_key or not secrets.compare_digest(x_admin_key, ADMIN_SECRET):
        raise HTTPException(status_code=401, detail="Invalid or missing admin key")

# ---------------------------------------------------------------------------
# Simple in-memory TTL cache
# ---------------------------------------------------------------------------
_cache: dict[str, tuple[float, any]] = {}

def _cache_get(key: str, ttl: int):
    """Return cached value if it exists and hasn't expired, else None."""
    entry = _cache.get(key)
    if entry and (time.time() - entry[0]) < ttl:
        return entry[1]
    return None

def _cache_set(key: str, value):
    _cache[key] = (time.time(), value)

def to_stats_obj(d):
    return SimpleNamespace(**d)

def _today_vegas() -> date:
    """Return today's date in Las Vegas time (America/Los_Angeles)."""
    return datetime.now(ZoneInfo("America/Los_Angeles")).date()

app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
print("ALLOWED_ORIGINS =", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Admin verify endpoint
# ---------------------------------------------------------------------------
@app.post("/admin/verify")
def admin_verify(_: None = Depends(verify_admin_key)):
    """Lightweight endpoint used by the frontend to validate an admin key."""
    return {"ok": True}

def name_to_slug(name: str) -> str:
    return name.lower().replace(" ", "-")

def _format_event_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")

    if isinstance(value, str):
        # Normalize "Sept." to "Sep." but don't replace "Sept" in "September"
        normalized = value.replace("Sept.", "Sep.").replace("Sept ", "Sep ")
        for fmt in ("%b. %d, %Y", "%b %d, %Y", "%B %d, %Y", "%m/%d/%Y"):
            try:
                dt = datetime.strptime(normalized, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return value

    try:
        return datetime.fromisoformat(str(value)).strftime("%Y-%m-%d")
    except Exception:
        return str(value)

def _get_prediction_event_info(db, fighter_a: str, fighter_b: str):
    result = (
        db.query(FightResult.event, FightResult.event_date)
        .filter(
            or_(
                and_(
                    FightResult.fighter_name == fighter_a,
                    FightResult.opponent_name == fighter_b,
                ),
                and_(
                    FightResult.fighter_name == fighter_b,
                    FightResult.opponent_name == fighter_a,
                ),
            )
        )
        .order_by(FightResult.id.desc())
        .first()
    )

    if result:
        return {
            "event": result.event,
            "event_date": _format_event_date(result.event_date),
        }

    return {"event": None, "event_date": None}

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
        if res.status_code != 200:
            return None

        soup = BeautifulSoup(res.text, "html.parser")

        meta_tag = soup.find("meta", property="og:image")
        if meta_tag and meta_tag.get("content"):
            return meta_tag["content"]

        img_tag = soup.find("img", {"src": re.compile(r"/images/styles/event_results_athlete_headshot")})
        if img_tag:
            src = img_tag["src"]
            return "https://ufc.com" + src if src.startswith("/") else src

    except Exception as e:
        print(f"Exception while scraping image: {e}")

    print("No image found.")
    return None


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "UFC Fight Simulator API is running"}

@app.get("/fighters")
def list_fighters():
    db = SessionLocal()
    fighters = db.query(Fighter).order_by(Fighter.name).all()
    db.close()
    return [{"name": f.name, "image": f.image_url} for f in fighters]

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
    results = simulate_fight(P_A, P_B, P_neutral, 5, name_A=name_A, name_B=name_B)

    return {
        "fighters": [name_A, name_B],
        "probabilities": {"P_A": P_A, "P_B": P_B, "P_neutral": P_neutral},
        "results": results,
    }

@app.get("/events")
def list_upcoming_events():
    cached = _cache_get("events", ttl=300)
    if cached is not None:
        return cached

    db = SessionLocal()
    try:
        # Get events from both upcoming and completed pages (for today's events)
        raw_events = get_upcoming_event_links()
        # Also check completed events from the last 3 days to catch recent/ongoing events
        completed_recent = get_completed_event_links(days_back=3)
        # Merge and deduplicate by URL
        seen_urls = {e["url"] for e in raw_events}
        for e in completed_recent:
            if e["url"] not in seen_urls:
                raw_events.append(e)
                seen_urls.add(e["url"])
        
        ongoing_events = []
        upcoming_events = []

        for e in raw_events:
            event_id = e["url"].split("/")[-1]
            event_url = e["url"]

            event_date = (
                db.query(FightResult.event_date)
                .filter(
                    FightResult.event == e["title"],
                    FightResult.event_date.isnot(None),
                )
                .order_by(FightResult.id.desc())
                .first()
            )

            event_date_value = event_date[0] if event_date else None

            iso_date = None
            display_date = None
            event_date_obj_for_comparison = None

            # Try to get date from database first
            if event_date_value:
                iso_date = _format_event_date(event_date_value)
                display_date = event_date_value
                try:
                    event_date_obj_for_comparison = datetime.strptime(iso_date, "%Y-%m-%d").date()
                except (ValueError, AttributeError):
                    pass
            # Fallback to scraped date (datetime object)
            elif e.get("date") and isinstance(e.get("date"), datetime):
                event_date_obj_for_comparison = e.get("date").date()
                iso_date = e.get("date").strftime("%Y-%m-%d")
                display_date = e.get("date")
            # Fallback to scraped date_text (string)
            elif e.get("date_text"):
                fallback_date = _format_event_date(e["date_text"])
                if fallback_date:
                    iso_date = fallback_date
                    display_date = e.get("date_text")
                    try:
                        event_date_obj_for_comparison = datetime.strptime(iso_date, "%Y-%m-%d").date()
                    except (ValueError, AttributeError):
                        pass

            # Format display date string
            if isinstance(display_date, datetime):
                display_date_str = display_date.strftime("%b %d, %Y")
            elif display_date is not None:
                display_date_str = str(display_date)
            else:
                display_date_str = None

            # An event is "ongoing" for the entire calendar day it's scheduled,
            # measured in Las Vegas time (where UFC events are based).
            is_ongoing = False
            today = _today_vegas()
            if event_date_obj_for_comparison:
                is_ongoing = event_date_obj_for_comparison == today
            else:
                logger.warning(f"Event: {e['title']}, Could not parse date. event_date_value: {event_date_value}, scraped date: {e.get('date')}, date_text: {e.get('date_text')}")

            event_data = {
                "id": event_id,
                "name": e["title"],
                "url": event_url,
                "status": "ongoing" if is_ongoing else "upcoming",
                "event_date": iso_date,
                "event_date_display": display_date_str,
            }

            if is_ongoing:
                ongoing_events.append(event_data)
            else:
                upcoming_events.append(event_data)

        result = ongoing_events + upcoming_events
        _cache_set("events", result)
        return result
    except Exception as e:
        logger.exception("Error in list_upcoming_events")
        return {"error": str(e)}
    finally:
        db.close()

@app.get("/event-card/{event_id}")
def get_event_card(event_id: str):
    """Return the fight card (fighter names + images) without running any simulation."""
    cache_key = f"event-card:{event_id}"
    cached = _cache_get(cache_key, ttl=600)
    if cached is not None:
        return cached

    event_url = f"http://ufcstats.com/event-details/{event_id}"
    card = get_fight_card(event_url)
    if not card:
        return {"error": f"No fight card found for event {event_id}"}

    db = SessionLocal()
    try:
        fights = []
        for fight in card:
            name_a = fight["fighter_a"]
            name_b = fight["fighter_b"]
            f1 = db.query(Fighter).filter(Fighter.name == name_a).first()
            f2 = db.query(Fighter).filter(Fighter.name == name_b).first()
            fights.append({
                "fighters": [
                    {"name": name_a, "image": f1.image_url if f1 else None},
                    {"name": name_b, "image": f2.image_url if f2 else None},
                ]
            })
        result = {"event_id": event_id, "fights": fights}
        _cache_set(cache_key, result)
        return result
    finally:
        db.close()


@app.get("/simulate-event/{event_id}")
def simulate_full_event(event_id: str, model: str = Query("ensemble", enum=["sim", "ml", "ensemble"])):
    event_url = f"http://ufcstats.com/event-details/{event_id}"
    try:
        response = _ufc_scraper.get(event_url)
        soup = BeautifulSoup(response.text, "html.parser")
        title_tag = soup.find("h2", class_="b-content__title")
        event_title = title_tag.get_text(strip=True) if title_tag else f"Event ID {event_id}"
    except:
        event_title = f"Event ID {event_id}"

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

        f1 = db.query(Fighter).filter(Fighter.name == name_a).first()
        if not f1:
            stats = scrape_fighter_stats(name_a, url_a)
            if stats:
                image_url = get_fighter_image_url(name_a)
                if image_url:
                    stats["image_url"] = image_url
                save_fighter_to_db(stats)
                f1 = db.query(Fighter).filter(Fighter.name == name_a).first()

        f2 = db.query(Fighter).filter(Fighter.name == name_b).first()
        if not f2:
            stats = scrape_fighter_stats(name_b, url_b)
            if stats:
                image_url = get_fighter_image_url(name_b)
                if image_url:
                    stats["image_url"] = image_url
                save_fighter_to_db(stats)
                f2 = db.query(Fighter).filter(Fighter.name == name_b).first()

        if f1 and f2:
            try:
                if model == "sim":
                    P_A, P_B, P_neutral = calculate_exchange_probabilities(f1, f2)
                    results = simulate_fight(P_A, P_B, P_neutral, 5, name_A=name_a, name_B=name_b)
                    fight_results.append({
                        "fighters": [{"name": name_a, "image": f1.image_url}, {"name": name_b, "image": f2.image_url}],
                        "model": "sim",
                        "probabilities": {"P_A": P_A, "P_B": P_B, "P_neutral": P_neutral},
                        "results": results
                    })
                else:
                    results = get_ensemble_prediction(name_a, name_b, model, log_to_db=False)
                    fight_data = {
                        "fighters": [
                            {"name": name_a, "image": f1.image_url},
                            {"name": name_b, "image": f2.image_url}
                        ],
                        "model": model,
                        "results": {
                            name_a: results["fighter_a_win_prob"],
                            name_b: results["fighter_b_win_prob"],
                            "Draw": 100.0 - results["fighter_a_win_prob"] - results["fighter_b_win_prob"]
                        }
                    }
                    
                    # Add penalty score and diffs for ML and Ensemble models
                    if "penalty_score" in results:
                        fight_data["penalty_score"] = results["penalty_score"]
                    if "diffs" in results:
                        fight_data["diffs"] = results["diffs"]
                    
                    fight_results.append(fight_data)

            except Exception as e:
                fight_results.append({"fighters": [name_a, name_b], "error": str(e)})
        else:
            fight_results.append({"fighters": [name_a, name_b], "error": "Missing fighter stats"})

    db.close()
    return {"event": event_title, "model": model, "fights": fight_results}

class CustomSimRequest(BaseModel):
    fighter_a: str
    fighter_b: str
    model: str = "ensemble"

@app.post("/simulate-custom")
def simulate_custom_fight(req: CustomSimRequest):
    db = SessionLocal()
    name_a = req.fighter_a.strip()
    name_b = req.fighter_b.strip()
    model = req.model
    f1 = db.query(Fighter).filter(Fighter.name == name_a).first()
    f2 = db.query(Fighter).filter(Fighter.name == name_b).first()
    db.close()

    if not f1 or not f2:
        return {"error": "One or both fighters not found in the database."}

    try:
        if model == "sim":
            P_A, P_B, P_neutral = calculate_exchange_probabilities(f1, f2)
            results = simulate_fight(P_A, P_B, P_neutral, 5, name_A=name_a, name_B=name_b)
            return {
                "fighters": [{"name": name_a, "image": f1.image_url}, {"name": name_b, "image": f2.image_url}],
                "model": "sim",
                "probabilities": {"P_A": P_A, "P_B": P_B, "P_neutral": P_neutral},
                "results": results
            }
        else:
            ensemble_result = get_ensemble_prediction(name_a, name_b, model, log_to_db=False)
            # Normalize the response format to match simulation format
            response = {
                "fighters": [{"name": name_a, "image": f1.image_url}, {"name": name_b, "image": f2.image_url}],
                "model": model,
                "results": {
                    name_a: ensemble_result["fighter_a_win_prob"],
                    name_b: ensemble_result["fighter_b_win_prob"],
                    "Draw": 100.0 - ensemble_result["fighter_a_win_prob"] - ensemble_result["fighter_b_win_prob"]
                }
            }
            
            # Add penalty score and diffs for ML and Ensemble models
            if "penalty_score" in ensemble_result:
                response["penalty_score"] = ensemble_result["penalty_score"]
            if "diffs" in ensemble_result:
                response["diffs"] = ensemble_result["diffs"]
            
            return response
    except Exception as e:
        return {"error": str(e)}

@app.post("/ml-predict")
def predict_from_ml(req: CustomSimRequest):
    from src.ml.ml_predict import predict_fight_outcome
    return predict_fight_outcome(req.fighter_a, req.fighter_b)

@app.post("/refresh-images")
def refresh_fighter_images(_: None = Depends(verify_admin_key)):
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
    db.commit()
    db.close()
    return {"updated": updated, "skipped": skipped, "total": len(fighters)}


@app.get("/model-performance")
def get_model_performance():
    """Get overall model performance statistics"""
    cached = _cache_get("model-performance", ttl=60)
    if cached is not None:
        return cached

    db = SessionLocal()
    
    try:
        def safe_round(v, n=1):
            if v is None or math.isnan(v) or math.isinf(v):
                return 0.0
            return round(v, n)

        # --- Aggregate counts via SQL (avoids loading every row into Python) ---
        total_predictions = db.query(func.count(ModelPrediction.id)).scalar() or 0

        predictions_with_results = (
            db.query(func.count(ModelPrediction.id))
            .filter(ModelPrediction.actual_winner.isnot(None))
            .scalar() or 0
        )

        correct_predictions = (
            db.query(func.count(ModelPrediction.id))
            .filter(ModelPrediction.actual_winner.isnot(None), ModelPrediction.correct.is_(True))
            .scalar() or 0
        )

        overall_accuracy = (correct_predictions / predictions_with_results * 100) if predictions_with_results else 0

        # Recent performance: last 10 completed predictions ordered by timestamp
        recent_rows = (
            db.query(ModelPrediction.correct)
            .filter(ModelPrediction.actual_winner.isnot(None))
            .order_by(ModelPrediction.timestamp.desc())
            .limit(10)
            .all()
        )
        recent_predictions_count = len(recent_rows)
        recent_correct = sum(1 for r in recent_rows if r.correct is True)
        recent_accuracy = (recent_correct / recent_predictions_count * 100) if recent_predictions_count else 0

        # Average confidence: compute in SQL
        avg_confidence_row = (
            db.query(
                func.avg(
                    case(
                        (ModelPrediction.fighter_a_prob > ModelPrediction.fighter_b_prob, ModelPrediction.fighter_a_prob),
                        else_=ModelPrediction.fighter_b_prob,
                    )
                )
            )
            .filter(
                ModelPrediction.fighter_a_prob.isnot(None),
                ModelPrediction.fighter_b_prob.isnot(None),
            )
            .scalar()
        )
        avg_confidence = safe_round(avg_confidence_row or 0)

        # Per-model breakdown via SQL
        model_breakdown = {}
        for model_name in ["ml", "ensemble", "sim"]:
            m_total = (
                db.query(func.count(ModelPrediction.id))
                .filter(ModelPrediction.model == model_name)
                .scalar() or 0
            )
            m_with_results = (
                db.query(func.count(ModelPrediction.id))
                .filter(ModelPrediction.model == model_name, ModelPrediction.actual_winner.isnot(None))
                .scalar() or 0
            )
            m_correct = (
                db.query(func.count(ModelPrediction.id))
                .filter(ModelPrediction.model == model_name, ModelPrediction.actual_winner.isnot(None), ModelPrediction.correct.is_(True))
                .scalar() or 0
            )
            model_breakdown[model_name] = {
                "total": m_total,
                "total_with_results": m_with_results,
                "correct": m_correct,
                "accuracy": round((m_correct / m_with_results * 100), 1) if m_with_results else 0,
            }

        best_model = "ensemble"
        best_accuracy = 0.0
        for model_name, stats in model_breakdown.items():
            if stats["total_with_results"] >= 3 and stats["accuracy"] > best_accuracy:
                best_model = model_name
                best_accuracy = stats["accuracy"]

        result = {
            "overall_accuracy": safe_round(overall_accuracy),
            "total_predictions": total_predictions,
            "predictions_with_results": predictions_with_results,
            "correct_predictions": correct_predictions,
            "recent_accuracy": safe_round(recent_accuracy),
            "recent_predictions_count": recent_predictions_count,
            "best_model": best_model,
            "best_model_accuracy": safe_round(best_accuracy),
            "avg_confidence": avg_confidence,
            "model_breakdown": model_breakdown,
        }
        _cache_set("model-performance", result)
        return result
    
    finally:
        db.close()


@app.get("/model-performance/detailed")
def get_detailed_performance():
    """Get detailed list of all predictions with results"""
    cached = _cache_get("model-performance-detailed", ttl=60)
    if cached is not None:
        return cached

    db = SessionLocal()
    
    try:
        predictions = db.query(ModelPrediction).order_by(ModelPrediction.timestamp.desc()).all()

        # --- Pre-fetch all event date info in two bulk queries ---
        # Map: event_name -> event_date (for predictions that have pred.event set)
        event_date_rows = (
            db.query(FightResult.event, FightResult.event_date)
            .filter(FightResult.event.isnot(None), FightResult.event_date.isnot(None))
            .all()
        )
        event_date_map: dict[str, any] = {}
        for row in event_date_rows:
            event_date_map.setdefault(row.event, row.event_date)

        # Map: (fighter_name, opponent_name) -> {event, event_date} for legacy rows (pred.event is None)
        fight_result_rows = (
            db.query(
                FightResult.fighter_name,
                FightResult.opponent_name,
                FightResult.event,
                FightResult.event_date,
            )
            .filter(FightResult.event_date.isnot(None))
            .order_by(FightResult.id.desc())
            .all()
        )
        fight_pair_map: dict[tuple, dict] = {}
        for row in fight_result_rows:
            for key in ((row.fighter_name, row.opponent_name), (row.opponent_name, row.fighter_name)):
                if key not in fight_pair_map:
                    fight_pair_map[key] = {
                        "event": row.event,
                        "event_date": _format_event_date(row.event_date),
                    }

        def safe_float(v):
            if v is None:
                return None
            try:
                return None if math.isnan(v) or math.isinf(v) else round(v, 1)
            except (TypeError, ValueError):
                return None

        detailed_results = []
        for pred in predictions:
            if pred.event:
                raw_date = event_date_map.get(pred.event)
                event_info = {
                    "event": pred.event,
                    "event_date": _format_event_date(raw_date) if raw_date else None,
                }
            else:
                event_info = fight_pair_map.get(
                    (pred.fighter_a, pred.fighter_b),
                    fight_pair_map.get((pred.fighter_b, pred.fighter_a), {"event": None, "event_date": None}),
                )

            detailed_results.append({
                "id": pred.id,
                "fighter_a": pred.fighter_a,
                "fighter_b": pred.fighter_b,
                "model": pred.model,
                "predicted_winner": pred.predicted_winner,
                "actual_winner": pred.actual_winner,
                "correct": pred.correct,
                "fighter_a_prob": safe_float(pred.fighter_a_prob),
                "fighter_b_prob": safe_float(pred.fighter_b_prob),
                "penalty_score": safe_float(pred.penalty_score),
                "timestamp": pred.timestamp.isoformat() if pred.timestamp else None,
                "has_result": pred.actual_winner is not None,
                "event": event_info["event"],
                "event_date": event_info["event_date"],
            })

        result = {
            "predictions": detailed_results,
            "total_count": len(detailed_results),
        }
        _cache_set("model-performance-detailed", result)
        return result
    
    finally:
        db.close()


@app.post("/update-fight-result")
def update_fight_result(
    fighter_a: str = Body(...),
    fighter_b: str = Body(...),
    actual_winner: str = Body(...),
    event: str = Body(None),
    _: None = Depends(verify_admin_key)
):
    """Update the actual result of a fight and mark predictions as correct/incorrect"""
    db = SessionLocal()
    
    try:
        # Find matching predictions, optionally scoped to a specific event (for rematches)
        base_filter = (
            ((ModelPrediction.fighter_a == fighter_a) & (ModelPrediction.fighter_b == fighter_b)) |
            ((ModelPrediction.fighter_a == fighter_b) & (ModelPrediction.fighter_b == fighter_a))
        )
        query = db.query(ModelPrediction).filter(base_filter)
        if event:
            query = query.filter(ModelPrediction.event == event)
        predictions = query.all()
        
        updated_count = 0
        for pred in predictions:
            pred.actual_winner = actual_winner
            pred.correct = (pred.predicted_winner == actual_winner)
            updated_count += 1
        
        # Note: We don't create new FightResult records here since the existing
        # scraping system handles that table with its own schema
        
        db.commit()

        # Bust performance caches so the next load reflects the new result immediately
        _cache.pop("model-performance", None)
        _cache.pop("model-performance-detailed", None)

        return {
            "message": f"Updated {updated_count} predictions",
            "predictions_updated": updated_count,
            "result_saved": True
        }
    
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    
    finally:
        db.close()

# Scheduler startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Start the UFC scheduler when the app starts, then warm the homepage caches."""
    try:
        start_scheduler()
        print("UFC Scheduler started")
    except Exception as e:
        print(f"Failed to start scheduler: {e}")

    import threading
    def _warm_cache():
        try:
            print("Cache warm-up: fetching event list …")
            from src.ufc_scraper import get_upcoming_event_links, get_completed_event_links
            today = date.today()
            yesterday = today - timedelta(days=1)

            upcoming = get_upcoming_event_links()
            recent = get_completed_event_links(days_back=3)
            all_events = {e["url"]: e for e in recent}
            for e in upcoming:
                all_events.setdefault(e["url"], e)

            # Mirror the same logic used in /events — ongoing = event is today (Vegas time)
            today_wu = _today_vegas()

            candidate = None
            for e in all_events.values():
                event_date = e.get("date")
                if isinstance(event_date, datetime) and event_date.date() == today_wu:
                    candidate = e
                    break
            if not candidate and upcoming:
                candidate = upcoming[0]
            if not candidate:
                print("Cache warm-up: no events found")
                return

            event_id = candidate["url"].split("/")[-1]
            cache_key = f"event-card:{event_id}"
            if _cache_get(cache_key, ttl=600) is not None:
                print(f"Cache warm-up: {event_id} already cached")
                return

            print(f"Cache warm-up: fetching fight card for {event_id} …")
            card = get_fight_card(f"http://ufcstats.com/event-details/{event_id}")
            if card:
                db = SessionLocal()
                try:
                    fights = []
                    for fight in card:
                        name_a, name_b = fight["fighter_a"], fight["fighter_b"]
                        f1 = db.query(Fighter).filter(Fighter.name == name_a).first()
                        f2 = db.query(Fighter).filter(Fighter.name == name_b).first()
                        fights.append({"fighters": [
                            {"name": name_a, "image": f1.image_url if f1 else None},
                            {"name": name_b, "image": f2.image_url if f2 else None},
                        ]})
                    _cache_set(cache_key, {"event_id": event_id, "fights": fights})
                    print(f"Cache warm-up: fight card cached for {event_id}")
                finally:
                    db.close()
        except Exception as e:
            print(f"Cache warm-up failed: {e}")

    threading.Thread(target=_warm_cache, daemon=True).start()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop the UFC scheduler when the app shuts down"""
    try:
        stop_scheduler()
        print("🛑 UFC Scheduler stopped")
    except Exception as e:
        print(f"Error stopping scheduler: {e}")

# Scheduler management endpoints
@app.get("/scheduler/status")
def get_scheduler_status():
    """Get the current status of the scheduler"""
    try:
        scheduler = get_scheduler()
        return scheduler.get_status()
    except Exception as e:
        return {"error": str(e)}

@app.post("/scheduler/check-results")
def manual_result_check(_: None = Depends(verify_admin_key)):
    """Manually trigger a check for completed events"""
    try:
        scheduler = get_scheduler()
        return scheduler.check_completed_events_manual()
    except Exception as e:
        return {"error": str(e)}

@app.post("/scheduler/check-events")
def manual_event_check(_: None = Depends(verify_admin_key)):
    """Manually trigger a check for new events"""
    try:
        scheduler = get_scheduler()
        return scheduler.check_new_events_manual()
    except Exception as e:
        return {"error": str(e)}

@app.post("/scheduler/cleanup-old-predictions")
def manual_cleanup_old_predictions(_: None = Depends(verify_admin_key)):
    """Manually trigger cleanup of stale pending predictions"""
    try:
        scheduler = get_scheduler()
        return scheduler.cleanup_old_predictions_manual()
    except Exception as e:
        return {"error": str(e)}

@app.post("/scheduler/pause")
def pause_scheduler(_: None = Depends(verify_admin_key)):
    """Pause the scheduler to stop automatic job execution"""
    try:
        scheduler = get_scheduler()
        scheduler.scheduler.pause()
        return {"message": "Scheduler paused successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/scheduler/resume")
def resume_scheduler(_: None = Depends(verify_admin_key)):
    """Resume the scheduler to allow automatic job execution"""
    try:
        scheduler = get_scheduler()
        scheduler.scheduler.resume()
        return {"message": "Scheduler resumed successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/retrain-ml-model")
def retrain_ml_model_endpoint(min_new_results: int = Query(5, description="Minimum new results required to trigger retraining"), _: None = Depends(verify_admin_key)):
    """Manual trigger to retrain the ML model with latest fight results"""
    try:
        scheduler = get_scheduler()
        result = scheduler.retrain_ml_model_manual(min_new_results)
        return result
    except Exception as e:
        logger.error(f"ML retraining endpoint failed: {e}")
        return {"error": str(e), "retrained": False}

# Debug endpoints - only available in development
if os.getenv("ENVIRONMENT", "production").lower() != "production":
    @app.get("/test-result-scraping")
    def test_result_scraping():
        """Test endpoint to verify result scraping functionality"""
        try:
            from src.ufc_scraper import get_completed_event_links, get_fight_results, normalize_fighter_name
            
            # Get a few recent completed events with more generous timeframe
            completed_events = get_completed_event_links(days_back=90)  # Increased to 90 days
            
            if not completed_events:
                return {"message": "No completed events found in the last 90 days"}
            
            # Test with multiple recent events to find results
            debug_info = []
            total_results = 0
            
            for i, event in enumerate(completed_events[:3]):  # Test first 3 events
                try:
                    results = get_fight_results(event['url'])
                    debug_info.append({
                        "event": event['title'],
                        "url": event['url'],
                        "date": event.get('date', 'Unknown'),
                        "results_count": len(results),
                        "sample_results": results[:2] if results else []  # Show first 2 results
                    })
                    total_results += len(results)
                except Exception as e:
                    debug_info.append({
                        "event": event['title'],
                        "url": event['url'],
                        "error": str(e)
                    })
            
            return {
                "total_events_checked": len(debug_info),
                "total_results_found": total_results,
                "events_detail": debug_info,
                "message": f"Detailed result scraping test completed. Found {total_results} total results across {len(debug_info)} events."
            }
            
        except Exception as e:
            return {"error": str(e), "traceback": traceback.format_exc()}

    @app.get("/debug-event-html/{event_id}")
    def debug_event_html(event_id: str):
        """Debug endpoint to examine the HTML structure of an event page"""
        try:
            event_url = f"http://ufcstats.com/event-details/{event_id}"
            response = _ufc_scraper.get(event_url)
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Get basic event info
            title_tag = soup.find("h2", class_="b-content__title")
            event_title = title_tag.get_text(strip=True) if title_tag else "Unknown Event"
            
            # Find fight table
            fight_rows = soup.select("tbody.b-fight-details__table-body tr")
            
            debug_info = {
                "event_title": event_title,
                "event_url": event_url,
                "total_fight_rows": len(fight_rows),
                "sample_fight_structure": []
            }
            
            # Analyze first few fights for structure
            for i, row in enumerate(fight_rows[:3]):
                fighter_links = row.select("a.b-link.b-link_style_black")
                cells = row.select("td")
                
                fight_debug = {
                    "row_index": i,
                    "fighter_links_count": len(fighter_links),
                    "total_cells": len(cells),
                    "fighters": [link.get_text(strip=True) for link in fighter_links[:2]],
                    "cell_contents": [cell.get_text(strip=True)[:50] for cell in cells[:8]],  # First 8 cells, truncated
                    "row_html_sample": str(row)[:500]  # First 500 chars of HTML
                }
                debug_info["sample_fight_structure"].append(fight_debug)
            
            return debug_info
            
        except Exception as e:
            return {"error": str(e), "traceback": traceback.format_exc()}

# Scheduler API functions
