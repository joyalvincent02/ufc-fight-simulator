#!/usr/bin/env python3
"""
Setup script for model prediction tracking
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.db import Base, engine, SessionLocal, ModelPrediction, FightResult
from sqlalchemy import inspect

def setup_tracking_tables():
    """Create tracking tables if they don't exist"""
    print("🔧 Setting up model prediction tracking tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Check if tables were created
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if 'model_predictions' in tables:
        print("✅ model_predictions table ready")
    else:
        print("❌ model_predictions table not found")
    
    if 'fight_results' in tables:
        print("✅ fight_results table ready")
    else:
        print("❌ fight_results table not found")
    
    # Show existing data (safer approach)
    db = SessionLocal()
    try:
        prediction_count = db.query(ModelPrediction).count()
        print(f"📊 Current predictions: {prediction_count}")
        
        # For fight_results, we need to be careful since it has a different schema
        try:
            # Use raw SQL to count since the model might not match exactly
            from sqlalchemy import text
            result = db.execute(text("SELECT COUNT(*) FROM fight_results"))
            result_count = result.scalar()
            print(f"📊 Current fight results: {result_count}")
        except Exception as e:
            print(f"📊 Fight results table exists but couldn't count: {e}")
            
    except Exception as e:
        print(f"❌ Error checking data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    setup_tracking_tables()
    print("🚀 Setup complete! Ready to track model predictions.")
