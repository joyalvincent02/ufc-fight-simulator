#!/usr/bin/env python3
"""
Generate comprehensive predictions for upcoming UFC events.
Ensures all three models (ML, Ensemble, Simulation) are generated for each fight.
"""

from src.db import SessionLocal, ModelPrediction
from src.ufc_scraper import get_upcoming_event_links, get_fight_card
from src.ensemble_predict import get_ensemble_prediction
from datetime import datetime
from collections import defaultdict

def generate_complete_predictions():
    """Generate missing predictions to ensure all fights have ML, Ensemble, and Simulation predictions"""
    print("Generating complete predictions for upcoming UFC events...")
    
    try:
        events = get_upcoming_event_links()
        print(f"Found {len(events)} upcoming events")
        
        total_new_predictions = 0
        
        for event in events:
            event_url = event["url"]
            event_title = event["title"]
            print(f"\nProcessing event: {event_title}")
            
            # Get fight card for this event
            fight_card = get_fight_card(event_url)
            
            if not fight_card:
                print(f"No fight card found for {event_title}")
                continue
                
            print(f"Found {len(fight_card)} fights")
            
            # For each fight, ensure all three models have predictions
            for fight in fight_card:
                fighter_a = fight["fighter_a"]
                fighter_b = fight["fighter_b"]
                
                print(f"\nChecking predictions for: {fighter_a} vs {fighter_b}")
                
                # Check existing predictions for this fight
                db = SessionLocal()
                existing_preds = db.query(ModelPrediction).filter(
                    ((ModelPrediction.fighter_a == fighter_a) & (ModelPrediction.fighter_b == fighter_b)) |
                    ((ModelPrediction.fighter_a == fighter_b) & (ModelPrediction.fighter_b == fighter_a))
                ).all()
                
                # Count predictions by model
                existing_models = defaultdict(int)
                for pred in existing_preds:
                    existing_models[pred.model] += 1
                
                db.close()
                
                print(f"  Existing predictions: {dict(existing_models)}")
                
                # Generate missing predictions
                required_models = ["ml", "ensemble", "sim"]
                
                for model in required_models:
                    if existing_models[model] == 0:
                        try:
                            print(f"  Generating {model.upper()} prediction...")
                            
                            # Get prediction (this will also log it to the database)
                            prediction_result = get_ensemble_prediction(fighter_a, fighter_b, model)
                            
                            prob_a = prediction_result["fighter_a_win_prob"]
                            prob_b = prediction_result["fighter_b_win_prob"]
                            winner = fighter_a if prob_a > prob_b else fighter_b
                            
                            print(f"    {model.upper()}: {winner} ({prob_a}% vs {prob_b}%)")
                            total_new_predictions += 1
                            
                        except Exception as e:
                            print(f"    Error generating {model} prediction: {e}")
                    else:
                        print(f"  {model.upper()} prediction already exists")
                        
        print(f"\nCompleted! Generated {total_new_predictions} new predictions.")
        
    except Exception as e:
        print(f"Error processing events: {e}")

def show_prediction_summary():
    """Show a summary of predictions by model and fight"""
    db = SessionLocal()
    try:
        # Get all predictions without results
        pending = db.query(ModelPrediction).filter(ModelPrediction.actual_winner.is_(None)).all()
        
        if not pending:
            print("No pending predictions found.")
            return
            
        print(f"\nPrediction Summary ({len(pending)} total pending):")
        
        # Group by fight
        fights = defaultdict(list)
        for pred in pending:
            fight_key = f"{pred.fighter_a} vs {pred.fighter_b}"
            fights[fight_key].append(pred)
        
        # Count fights by completeness
        complete_fights = 0  # Have all 3 models
        partial_fights = 0   # Have 1-2 models
        
        for fight, predictions in fights.items():
            models = set(pred.model for pred in predictions)
            if len(models) == 3:
                complete_fights += 1
            else:
                partial_fights += 1
        
        print(f"  Complete fights (all 3 models): {complete_fights}")
        print(f"  Partial fights (1-2 models): {partial_fights}")
        
        # Show fights that need more predictions
        if partial_fights > 0:
            print(f"\nFights needing more predictions:")
            for fight, predictions in fights.items():
                models = set(pred.model for pred in predictions)
                if len(models) < 3:
                    missing = set(["ml", "ensemble", "sim"]) - models
                    print(f"  {fight}: missing {', '.join(missing).upper()}")
        
        # Show overall model counts
        model_counts = defaultdict(int)
        for pred in pending:
            model_counts[pred.model] += 1
        
        print(f"\nModel distribution:")
        for model, count in model_counts.items():
            print(f"  {model.upper()}: {count} predictions")
            
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "generate":
            generate_complete_predictions()
        elif command == "summary":
            show_prediction_summary()
        else:
            print("Usage: python generate_predictions.py [generate|summary]")
    else:
        print("UFC Prediction Generator")
        print("Usage:")
        print("  python generate_predictions.py generate - Generate missing predictions for upcoming events")
        print("  python generate_predictions.py summary  - Show prediction summary")
