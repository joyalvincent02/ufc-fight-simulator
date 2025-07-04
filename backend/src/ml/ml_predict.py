# backend/src/ml/ml_predict.py

import joblib
import numpy as np
from src.db import SessionLocal, Fighter

model = joblib.load("src/ml/fight_predictor.pkl")

def get_fighter_features(session, name):
    fighter = session.query(Fighter).filter(Fighter.name == name).first()
    if not fighter:
        raise ValueError(f"Fighter '{name}' not found in database.")
    return [
        fighter.slpm,
        fighter.str_acc,
        fighter.str_def,
        fighter.td_avg,
        fighter.td_acc,
        fighter.td_def,
        fighter.sub_avg,
    ]

def predict_fight_outcome(fighter_a_name: str, fighter_b_name: str):
    db = SessionLocal()

    try:
        fighter_a_stats = get_fighter_features(db, fighter_a_name)
        fighter_b_stats = get_fighter_features(db, fighter_b_name)

        # Concatenate feature vectors: [A stats..., B stats...]
        features = np.array(fighter_a_stats + fighter_b_stats).reshape(1, -1)
        prob = model.predict_proba(features)[0]

        db.close()

        return {
            "fighter_a": fighter_a_name,
            "fighter_b": fighter_b_name,
            "fighter_a_win_prob": round(prob[1] * 100, 2),
            "fighter_b_win_prob": round(prob[0] * 100, 2)
        }
    except Exception as e:
        db.close()
        raise e
