from src.ml.ml_predict import predict_fight_outcome
from src.simulate_fight import simulate_fight
from src.fight_model import calculate_exchange_probabilities
from src.db import SessionLocal, Fighter, log_prediction

def get_ensemble_prediction(fighter_a: str, fighter_b: str, model_type: str = "ensemble", sim_runs: int = 1000, log_to_db: bool = True):
    """
    Get ensemble prediction for two fighters.
    
    Args:
        fighter_a: Name of first fighter
        fighter_b: Name of second fighter  
        model_type: Type of model to use ("ml", "ensemble", or "sim")
        sim_runs: Number of simulation runs for simulation component
        log_to_db: Whether to log the prediction to the database (True for scheduled/automatic predictions, False for custom simulations)
    
    Returns:
        Dictionary containing prediction results and probabilities
    """
    # Run ML model
    ml_result = predict_fight_outcome(fighter_a, fighter_b)
    ml_prob = ml_result["fighter_a_win_prob"] / 100  # Convert to 0-1

    # Get fighter data for simulation
    db = SessionLocal()
    f1 = db.query(Fighter).filter(Fighter.name == fighter_a).first()
    f2 = db.query(Fighter).filter(Fighter.name == fighter_b).first()
    db.close()

    if f1 and f2:
        # Calculate probabilities for simulation
        P_A, P_B, P_neutral = calculate_exchange_probabilities(f1, f2)
        
        # Run fight simulation
        sim_result = simulate_fight(P_A, P_B, P_neutral, num_rounds=5, name_A=fighter_a, name_B=fighter_b, num_simulations=sim_runs)
        sim_prob = sim_result[fighter_a] / 100  # Convert to 0-1
    else:
        # Fallback if fighters not found
        sim_prob = 0.5

    # Calculate confidence scores for each model
    def calculate_confidence(prob):
        """Calculate confidence based on how far from 0.5 (neutral) the probability is"""
        return abs(prob - 0.5) * 2  # Scale to 0-1 range
    
    ml_confidence = calculate_confidence(ml_prob)
    sim_confidence = calculate_confidence(sim_prob)
    
    # Blend predictions based on model type
    if model_type == "ml":
        final_prob = ml_prob
    elif model_type == "sim":
        final_prob = sim_prob
    else:
        # Confidence-weighted ensemble
        if ml_confidence + sim_confidence > 0:
            # Weight models by their confidence levels
            ml_weight = ml_confidence / (ml_confidence + sim_confidence)
            sim_weight = sim_confidence / (ml_confidence + sim_confidence)
            
            # Apply base weights adjusted by confidence
            base_ml_weight = 0.6  # Favor ML model slightly
            base_sim_weight = 0.4
            
            # Combine base weights with confidence weights
            final_ml_weight = (base_ml_weight + ml_weight) / 2
            final_sim_weight = (base_sim_weight + sim_weight) / 2
            
            # Normalize weights
            total_weight = final_ml_weight + final_sim_weight
            final_ml_weight /= total_weight
            final_sim_weight /= total_weight
            
            final_prob = final_ml_weight * ml_prob + final_sim_weight * sim_prob
        else:
            # Fallback to simple average if both models are uncertain
            final_prob = 0.5

    # Determine predicted winner
    predicted_winner = fighter_a if final_prob > 0.5 else fighter_b
    
    # Log prediction to database (only if requested)
    if log_to_db and model_type in ["ml", "ensemble", "sim"]:
        diffs = ml_result.get("diffs", {})
        log_prediction(
            fighter_a=fighter_a,
            fighter_b=fighter_b,
            model=model_type,
            predicted_winner=predicted_winner,
            fighter_a_prob=float(round(final_prob * 100, 1)),
            fighter_b_prob=float(round((1 - final_prob) * 100, 1)),
            draw_prob=0.0,  # Current models don't predict draws
            penalty_score=float(ml_result.get("penalty_score")) if ml_result.get("penalty_score") is not None and model_type != "sim" else None,
            weight_diff=int(diffs.get("weight_diff")) if diffs.get("weight_diff") is not None and model_type != "sim" else None,
            height_diff=int(diffs.get("height_diff")) if diffs.get("height_diff") is not None and model_type != "sim" else None,
            reach_diff=int(diffs.get("reach_diff")) if diffs.get("reach_diff") is not None and model_type != "sim" else None,
            age_diff=int(diffs.get("age_diff")) if diffs.get("age_diff") is not None and model_type != "sim" else None
        )

    return {
        "fighter_a": fighter_a,
        "fighter_b": fighter_b,
        "model": model_type,
        "fighter_a_win_prob": round(final_prob * 100, 1),
        "fighter_b_win_prob": round((1 - final_prob) * 100, 1),
        "ml_win_prob": round(ml_prob * 100, 1),
        "sim_win_prob": round(sim_prob * 100, 1),
        "ensemble_win_prob": round(final_prob * 100, 1),
        "penalty_score": ml_result.get("penalty_score", None),
        "diffs": ml_result.get("diffs", {})
    }
