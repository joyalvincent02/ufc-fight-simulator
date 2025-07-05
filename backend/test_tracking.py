#!/usr/bin/env python3
"""
Test script for model prediction tracking
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.db import SessionLocal, ModelPrediction, FightResult
from src.ensemble_predict import get_ensemble_prediction
import requests

def test_prediction_logging():
    """Test that predictions are being logged correctly"""
    print("🧪 Testing prediction logging...")
    
    # Make a test prediction
    result = get_ensemble_prediction("Jon Jones", "Stipe Miocic", "ml")
    print(f"✅ Prediction result: {result}")
    
    # Check if it was logged
    db = SessionLocal()
    try:
        latest_prediction = db.query(ModelPrediction).order_by(ModelPrediction.timestamp.desc()).first()
        if latest_prediction:
            print(f"✅ Latest prediction logged: {latest_prediction.fighter_a} vs {latest_prediction.fighter_b}")
            print(f"   Model: {latest_prediction.model}")
            print(f"   Predicted winner: {latest_prediction.predicted_winner}")
            print(f"   Probabilities: {latest_prediction.fighter_a_prob}% / {latest_prediction.fighter_b_prob}%")
        else:
            print("❌ No predictions found in database")
    finally:
        db.close()

def test_api_endpoints():
    """Test the API endpoints"""
    print("\n🧪 Testing API endpoints...")
    
    try:
        # Test model performance endpoint
        response = requests.get("http://localhost:8000/model-performance")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model performance API working")
            print(f"   Overall accuracy: {data.get('overall_accuracy', 0)}%")
            print(f"   Total predictions: {data.get('total_predictions', 0)}")
        else:
            print(f"❌ API error: {response.status_code}")
    except Exception as e:
        print(f"❌ API test failed: {e}")

def test_database_schema():
    """Test database schema"""
    print("\n🧪 Testing database schema...")
    
    db = SessionLocal()
    try:
        # Test ModelPrediction table
        prediction_count = db.query(ModelPrediction).count()
        print(f"✅ ModelPrediction table: {prediction_count} records")
        
        # Test FightResult table
        result_count = db.query(FightResult).count()
        print(f"✅ FightResult table: {result_count} records")
        
    except Exception as e:
        print(f"❌ Database schema error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting model prediction tracking tests...\n")
    
    test_database_schema()
    test_prediction_logging()
    test_api_endpoints()
    
    print("\n✅ All tests completed!")
