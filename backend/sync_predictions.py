#!/usr/bin/env python3
"""
Script to sync existing fight results with model predictions
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.db import SessionLocal, ModelPrediction
from sqlalchemy import text

def sync_predictions_with_results():
    """Sync predictions with existing fight results"""
    db = SessionLocal()
    
    try:
        # SQL to update predictions based on existing fight results
        sql = """
        UPDATE model_predictions 
        SET 
            actual_winner = CASE 
                WHEN fr.result = 'win' THEN fr.fighter_name
                WHEN fr.result = 'loss' THEN fr.opponent_name
                ELSE 'Draw'
            END,
            correct = CASE 
                WHEN fr.result = 'win' AND model_predictions.predicted_winner = fr.fighter_name THEN 1
                WHEN fr.result = 'loss' AND model_predictions.predicted_winner = fr.opponent_name THEN 1
                ELSE 0
            END
        FROM fight_results fr
        WHERE 
            (
                (model_predictions.fighter_a = fr.fighter_name AND model_predictions.fighter_b = fr.opponent_name) OR
                (model_predictions.fighter_a = fr.opponent_name AND model_predictions.fighter_b = fr.fighter_name)
            )
            AND model_predictions.actual_winner IS NULL
        """
        
        result = db.execute(text(sql))
        db.commit()
        
        print(f"✅ Updated {result.rowcount} predictions with existing fight results")
        
        # Show summary
        predictions = db.query(ModelPrediction).all()
        with_results = [p for p in predictions if p.actual_winner is not None]
        correct = [p for p in with_results if p.correct is True]
        
        print(f"📊 Summary:")
        print(f"   Total predictions: {len(predictions)}")
        print(f"   With results: {len(with_results)}")
        print(f"   Correct: {len(correct)}")
        print(f"   Accuracy: {len(correct)/len(with_results)*100:.1f}%" if with_results else "   Accuracy: N/A")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Syncing predictions with existing fight results...")
    sync_predictions_with_results()
    print("✅ Sync complete!")
