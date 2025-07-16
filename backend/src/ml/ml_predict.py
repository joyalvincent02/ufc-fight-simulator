import pandas as pd
import numpy as np
import joblib
import os
from src.azure_config import get_model_path

def load_model():
    """Load the ML model with Azure-compatible path"""
    model_path = get_model_path()
    try:
        return joblib.load(model_path)
    except FileNotFoundError:
        # Fallback to local path for development
        if os.path.exists("src/ml/fight_predictor.pkl"):
            return joblib.load("src/ml/fight_predictor.pkl")
        else:
            raise FileNotFoundError(f"Model not found at {model_path} or src/ml/fight_predictor.pkl")

# Load model on import
model = load_model()

def predict_fight_outcome(name_a, name_b):
    from src.db import SessionLocal, Fighter

    # Reload model in case it was retrained
    global model
    model = load_model()

    db = SessionLocal()
    f1 = db.query(Fighter).filter(Fighter.name == name_a).first()
    f2 = db.query(Fighter).filter(Fighter.name == name_b).first()
    db.close()

    if not f1 or not f2:
        raise ValueError("One or both fighters not found.")

    def safe(val):
        return float(val) if val is not None else 0.0

    def height_inches(h):
        if not h or "'" not in h:
            return 0
        parts = h.strip().split("'")
        return int(parts[0]) * 12 + int(parts[1].strip('" ')) if len(parts) == 2 else 0

    def weight_lbs(w):
        return int(w.replace("lbs.", "").strip()) if w and "lbs." in w else 0

    def reach_inches(r):
        return int(r.replace('"', '').strip()) if r and '"' in r else 0

    def compute_age(dob):
        if not dob:
            return 0
        from datetime import date
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    def compute_mismatch_penalty(weight_diff, height_diff, reach_diff):
        """Returns a penalty score between 0 and 1 based on mismatch severity."""
        abs_w = abs(weight_diff)
        abs_h = abs(height_diff)
        abs_r = abs(reach_diff)

        mismatch_score = (
            (abs_w / 100) * 0.5 +   # weight → up to 0.5
            (abs_h / 10) * 0.3 +    # height → up to 0.3
            (abs_r / 15) * 0.2      # reach  → up to 0.2
        )
        return min(mismatch_score, 1.0)

    # Compute raw values
    f1_height = height_inches(f1.height)
    f2_height = height_inches(f2.height)
    f1_weight = weight_lbs(f1.weight)
    f2_weight = weight_lbs(f2.weight)
    f1_reach = reach_inches(f1.reach)
    f2_reach = reach_inches(f2.reach)

    height_diff = f1_height - f2_height
    weight_diff = f1_weight - f2_weight
    reach_diff = f1_reach - f2_reach
    age_diff = compute_age(f1.dob) - compute_age(f2.dob)

    # Build feature vector with enhanced features
    features = {
        "f1_slpm": safe(f1.slpm),
        "f1_str_acc": safe(f1.str_acc),
        "f1_str_def": safe(f1.str_def),
        "f1_td_avg": safe(f1.td_avg),
        "f1_td_acc": safe(f1.td_acc),
        "f1_td_def": safe(f1.td_def),
        "f1_sub_avg": safe(f1.sub_avg),
        "f2_slpm": safe(f2.slpm),
        "f2_str_acc": safe(f2.str_acc),
        "f2_str_def": safe(f2.str_def),
        "f2_td_avg": safe(f2.td_avg),
        "f2_td_acc": safe(f2.td_acc),
        "f2_td_def": safe(f2.td_def),
        "f2_sub_avg": safe(f2.sub_avg),
        "reach_diff": reach_diff,
        "height_diff": height_diff,
        "weight_diff": weight_diff,
        "age_diff": age_diff,
        
        # Enhanced ratio features
        "slpm_ratio": safe(f1.slpm) / max(safe(f2.slpm), 0.1),
        "str_acc_ratio": safe(f1.str_acc) / max(safe(f2.str_acc), 0.1),
        "str_def_ratio": safe(f1.str_def) / max(safe(f2.str_def), 0.1),
        "td_avg_ratio": safe(f1.td_avg) / max(safe(f2.td_avg), 0.1),
        "td_acc_ratio": safe(f1.td_acc) / max(safe(f2.td_acc), 0.1),
        "td_def_ratio": safe(f1.td_def) / max(safe(f2.td_def), 0.1),
        "sub_avg_ratio": safe(f1.sub_avg) / max(safe(f2.sub_avg), 0.1),
        
        # Physical advantage features
        "reach_advantage": 1 if reach_diff > 2 else 0,
        "height_advantage": 1 if height_diff > 2 else 0,
        "weight_advantage": 1 if weight_diff > 5 else 0,
        "age_advantage": 1 if age_diff < -2 else 0,  # Younger is better
        
        # Combined striking effectiveness
        "f1_striking_score": safe(f1.slpm) * safe(f1.str_acc) * safe(f1.str_def),
        "f2_striking_score": safe(f2.slpm) * safe(f2.str_acc) * safe(f2.str_def),
        
        # Combined grappling effectiveness  
        "f1_grappling_score": safe(f1.td_avg) * safe(f1.td_acc) * safe(f1.td_def),
        "f2_grappling_score": safe(f2.td_avg) * safe(f2.td_acc) * safe(f2.td_def)
    }

    # Add one-hot encoded stance features
    model_features = model.feature_names_in_
    stance_keys = [col for col in model_features if "stance" in col]
    for key in stance_keys:
        features[key] = 0

    if f1.stance:
        key = f"f1_stance_{f1.stance}"
        if key in features:
            features[key] = 1
    if f2.stance:
        key = f"f2_stance_{f2.stance}"
        if key in features:
            features[key] = 1

    # Build input for model
    input_df = pd.DataFrame([features], columns=model_features)
    model_prob = model.predict_proba(input_df)[0]  # [prob_fighter_b_win, prob_fighter_a_win]

    # Compute penalty
    penalty_score = compute_mismatch_penalty(weight_diff, height_diff, reach_diff)

    # Scale probabilities toward heavier fighter
    if weight_diff > 0:
        # Fighter A is heavier
        adjusted = [
            model_prob[0] * (1 - penalty_score),
            model_prob[1] * (1 + penalty_score)
        ]
    else:
        # Fighter B is heavier
        adjusted = [
            model_prob[0] * (1 + penalty_score),
            model_prob[1] * (1 - penalty_score)
        ]

    # Normalize
    total = sum(adjusted)
    prob = [p / total for p in adjusted]

    return {
        "fighter_a": name_a,
        "fighter_b": name_b,
        "fighter_a_win_prob": float(round(prob[1] * 100, 1)),  # prob[1] is fighter_a win (class 1)
        "fighter_b_win_prob": float(round(prob[0] * 100, 1)),  # prob[0] is fighter_b win (class 0)
        "penalty_score": float(round(penalty_score, 3)),
        "diffs": {
            "weight_diff": int(weight_diff),
            "height_diff": int(height_diff),
            "reach_diff": int(reach_diff),
            "age_diff": int(age_diff)
        }
    }
