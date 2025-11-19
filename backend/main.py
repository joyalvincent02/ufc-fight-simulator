# backend/main.py
from fastapi import FastAPI, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.fight_model import calculate_exchange_probabilities
from src.simulate_fight import simulate_fight
from src.ufc_scraper import get_upcoming_event_links, get_fight_card
from src.fighter_scraper import scrape_fighter_stats, save_fighter_to_db
from src.db import SessionLocal, Fighter, ModelPrediction, FightResult
from src.ensemble_predict import get_ensemble_prediction
from src.ufc_scheduler import start_scheduler, stop_scheduler, get_scheduler
from types import SimpleNamespace
from bs4 import BeautifulSoup
from sqlalchemy import func
import requests
import re
import json
import os
import traceback
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

def to_stats_obj(d):
    return SimpleNamespace(**d)

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
    try:
        raw_events = get_upcoming_event_links()
        return [{"id": e["url"].split("/")[-1], "name": e["title"], "url": e["url"]} for e in raw_events]
    except Exception as e:
        return {"error": str(e)}

@app.get("/simulate-event/{event_id}")
def simulate_full_event(event_id: str, model: str = Query("ensemble", enum=["sim", "ml", "ensemble"])):
    event_url = f"http://ufcstats.com/event-details/{event_id}"
    try:
        response = requests.get(event_url)
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
    db.commit()
    db.close()
    return {"updated": updated, "skipped": skipped, "total": len(fighters)}


@app.get("/model-performance")
def get_model_performance():
    """Get overall model performance statistics"""
    db = SessionLocal()
    
    try:
        # Get all predictions with their results
        predictions = db.query(ModelPrediction).all()
        
        # Calculate overall stats
        total_predictions = len(predictions)
        predictions_with_results = [p for p in predictions if p.actual_winner is not None]
        correct_predictions = [p for p in predictions_with_results if p.correct is True]
        
        overall_accuracy = (len(correct_predictions) / len(predictions_with_results) * 100) if predictions_with_results else 0
        
        # Get recent performance (last 10 completed predictions)
        recent_predictions = [p for p in predictions_with_results][-10:] if predictions_with_results else []
        recent_correct = [p for p in recent_predictions if p.correct is True]
        recent_accuracy = (len(recent_correct) / len(recent_predictions) * 100) if recent_predictions else 0
        
        # Calculate average confidence (using highest probability from each prediction)
        predictions_with_confidence = [p for p in predictions if p.fighter_a_prob is not None and p.fighter_b_prob is not None]
        if predictions_with_confidence:
            total_confidence = sum(max(p.fighter_a_prob, p.fighter_b_prob) for p in predictions_with_confidence)
            avg_confidence = total_confidence / len(predictions_with_confidence)
        else:
            avg_confidence = 0
        
        # Break down by model
        model_breakdown = {}
        for model in ["ml", "ensemble", "sim"]:
            model_predictions = [p for p in predictions if p.model == model]
            model_with_results = [p for p in model_predictions if p.actual_winner is not None]
            model_correct = [p for p in model_with_results if p.correct is True]
            
            model_breakdown[model] = {
                "total": len(model_predictions),
                "total_with_results": len(model_with_results),
                "correct": len(model_correct),
                "accuracy": round((len(model_correct) / len(model_with_results) * 100), 1) if model_with_results else 0
            }
        
        # Find best performing model (after model_breakdown is calculated)
        best_model = "ensemble"  # default
        best_accuracy = 0
        for model_name, stats in model_breakdown.items():
            if stats["total_with_results"] >= 3 and stats["accuracy"] > best_accuracy:  # At least 3 results for meaningful comparison
                best_model = model_name
                best_accuracy = stats["accuracy"]
        
        return {
            "overall_accuracy": round(overall_accuracy, 1),
            "total_predictions": total_predictions,
            "predictions_with_results": len(predictions_with_results),
            "correct_predictions": len(correct_predictions),
            "recent_accuracy": round(recent_accuracy, 1),
            "recent_predictions_count": len(recent_predictions),
            "best_model": best_model,
            "best_model_accuracy": round(best_accuracy, 1),
            "avg_confidence": round(avg_confidence, 1),
            "model_breakdown": model_breakdown
        }
    
    finally:
        db.close()


@app.get("/model-performance/detailed")
def get_detailed_performance():
    """Get detailed list of all predictions with results"""
    db = SessionLocal()
    
    try:
        predictions = db.query(ModelPrediction).order_by(ModelPrediction.timestamp.desc()).all()
        
        detailed_results = []
        for pred in predictions:
            detailed_results.append({
                "id": pred.id,
                "fighter_a": pred.fighter_a,
                "fighter_b": pred.fighter_b,
                "model": pred.model,
                "predicted_winner": pred.predicted_winner,
                "actual_winner": pred.actual_winner,
                "correct": pred.correct,
                "fighter_a_prob": pred.fighter_a_prob,
                "fighter_b_prob": pred.fighter_b_prob,
                "penalty_score": pred.penalty_score,
                "timestamp": pred.timestamp.isoformat() if pred.timestamp else None,
                "has_result": pred.actual_winner is not None
            })
        
        return {
            "predictions": detailed_results,
            "total_count": len(detailed_results)
        }
    
    finally:
        db.close()


@app.post("/update-fight-result")
def update_fight_result(
    fighter_a: str = Body(...),
    fighter_b: str = Body(...),
    actual_winner: str = Body(...),
    event: str = Body(None)
):
    """Update the actual result of a fight and mark predictions as correct/incorrect"""
    db = SessionLocal()
    
    try:
        # Find matching predictions
        predictions = db.query(ModelPrediction).filter(
            ((ModelPrediction.fighter_a == fighter_a) & (ModelPrediction.fighter_b == fighter_b)) |
            ((ModelPrediction.fighter_a == fighter_b) & (ModelPrediction.fighter_b == fighter_a))
        ).all()
        
        updated_count = 0
        for pred in predictions:
            pred.actual_winner = actual_winner
            pred.correct = (pred.predicted_winner == actual_winner)
            updated_count += 1
        
        # Note: We don't create new FightResult records here since the existing
        # scraping system handles that table with its own schema
        
        db.commit()
        
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
    """Start the UFC scheduler when the app starts"""
    try:
        start_scheduler()
        print("UFC Scheduler started")
    except Exception as e:
        print(f"Failed to start scheduler: {e}")

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
def manual_result_check():
    """Manually trigger a check for completed events"""
    try:
        scheduler = get_scheduler()
        return scheduler.check_completed_events_manual()
    except Exception as e:
        return {"error": str(e)}

@app.post("/scheduler/check-events")
def manual_event_check():
    """Manually trigger a check for new events"""
    try:
        scheduler = get_scheduler()
        return scheduler.check_new_events_manual()
    except Exception as e:
        return {"error": str(e)}

@app.post("/scheduler/cleanup-old-predictions")
def manual_cleanup_old_predictions():
    """Manually trigger cleanup of stale pending predictions"""
    try:
        scheduler = get_scheduler()
        return scheduler.cleanup_old_predictions_manual()
    except Exception as e:
        return {"error": str(e)}

@app.post("/scheduler/pause")
def pause_scheduler():
    """Pause the scheduler to stop automatic job execution"""
    try:
        scheduler = get_scheduler()
        scheduler.scheduler.pause()
        return {"message": "Scheduler paused successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/scheduler/resume")
def resume_scheduler():
    """Resume the scheduler to allow automatic job execution"""
    try:
        scheduler = get_scheduler()
        scheduler.scheduler.resume()
        return {"message": "Scheduler resumed successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/retrain-ml-model")
def retrain_ml_model_endpoint(min_new_results: int = Query(5, description="Minimum new results required to trigger retraining")):
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
            response = requests.get(event_url)
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
