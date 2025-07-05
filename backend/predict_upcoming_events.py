#!/usr/bin/env python3
"""
Pre-generate predictions for upcoming UFC events using all three models.
This script should be run before events to store predictions, then results can be updated after.
"""

from src.db import SessionLocal, ModelPrediction, log_prediction
from src.ufc_scraper import get_upcoming_event_links, get_fight_card
from src.ensemble_predict import get_ensemble_prediction
from datetime import datetime

def predict_upcoming_events():
    """Generate predictions for all upcoming UFC events using all three models"""
    print("Fetching upcoming UFC events...")
    
    try:
        events = get_upcoming_event_links()
        print(f"Found {len(events)} upcoming events")
        
        total_predictions = 0
        
        for event in events:
            event_url = event["url"]
            event_title = event["title"]
            print(f"\nProcessing event: {event_title}")
            print(f"URL: {event_url}")
            
            # Get fight card for this event
            fight_card = get_fight_card(event_url)
            
            if not fight_card:
                print(f"No fight card found for {event_title}")
                continue
                
            print(f"Found {len(fight_card)} fights")
            
            # Generate predictions for each fight using all three models
            for fight in fight_card:
                fighter_a = fight["fighter_a"]
                fighter_b = fight["fighter_b"]
                
                print(f"\nGenerating predictions for: {fighter_a} vs {fighter_b}")
                
                # Check if predictions already exist for this fight
                db = SessionLocal()
                existing = db.query(ModelPrediction).filter(
                    ((ModelPrediction.fighter_a == fighter_a) & (ModelPrediction.fighter_b == fighter_b)) |
                    ((ModelPrediction.fighter_a == fighter_b) & (ModelPrediction.fighter_b == fighter_a))
                ).first()
                db.close()
                
                if existing:
                    print(f"  Predictions already exist for this fight, skipping...")
                    continue
                
                # Generate predictions for all three models
                models = ["ml", "ensemble", "sim"]
                
                for model in models:
                    try:
                        print(f"  Generating {model.upper()} prediction...")
                        
                        # Get prediction
                        prediction_result = get_ensemble_prediction(fighter_a, fighter_b, model)
                        
                        # The prediction is already logged by get_ensemble_prediction
                        # Just report the result
                        winner = prediction_result["predicted_winner"] if "predicted_winner" in prediction_result else (
                            fighter_a if prediction_result["fighter_a_win_prob"] > prediction_result["fighter_b_win_prob"] else fighter_b
                        )
                        
                        prob_a = prediction_result["fighter_a_win_prob"]
                        prob_b = prediction_result["fighter_b_win_prob"]
                        
                        print(f"    {model.upper()}: {winner} ({prob_a}% vs {prob_b}%)")
                        total_predictions += 1
                        
                    except Exception as e:
                        print(f"    Error generating {model} prediction: {e}")
                        
        print(f"\nCompleted! Generated {total_predictions} predictions for upcoming events.")
        
    except Exception as e:
        print(f"Error fetching events: {e}")

def show_pending_predictions():
    """Show all predictions that don't have results yet"""
    db = SessionLocal()
    try:
        pending = db.query(ModelPrediction).filter(ModelPrediction.actual_winner.is_(None)).all()
        
        if not pending:
            print("No pending predictions found.")
            return
            
        print(f"\nFound {len(pending)} pending predictions:")
        
        # Group by fight
        fights = {}
        for pred in pending:
            fight_key = f"{pred.fighter_a} vs {pred.fighter_b}"
            if fight_key not in fights:
                fights[fight_key] = []
            fights[fight_key].append(pred)
            
        for fight, predictions in fights.items():
            print(f"\n{fight}:")
            for pred in predictions:
                print(f"  {pred.model.upper()}: {pred.predicted_winner} ({pred.fighter_a_prob}% vs {pred.fighter_b_prob}%)")
                
    finally:
        db.close()

def update_event_results(event_title_or_url: str):
    """Update results for a specific event after it's completed"""
    print(f"This function would update results for: {event_title_or_url}")
    print("You would need to implement result scraping or manual input here.")
    print("For now, you can use the existing /update-fight-result API endpoint.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "predict":
            predict_upcoming_events()
        elif command == "show":
            show_pending_predictions()
        elif command == "update":
            if len(sys.argv) > 2:
                update_event_results(sys.argv[2])
            else:
                print("Usage: python predict_upcoming_events.py update <event_title_or_url>")
        else:
            print("Usage: python predict_upcoming_events.py [predict|show|update]")
    else:
        print("UFC Event Prediction Manager")
        print("Usage:")
        print("  python predict_upcoming_events.py predict  - Generate predictions for upcoming events")
        print("  python predict_upcoming_events.py show     - Show pending predictions")
        print("  python predict_upcoming_events.py update <event> - Update results for an event")
