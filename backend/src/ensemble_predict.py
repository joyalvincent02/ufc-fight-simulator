from src.ml.ml_predict import predict_fight_outcome
from src.simulate_fight import simulate_fight
from src.fight_model import calculate_exchange_probabilities
from src.db import SessionLocal, Fighter

def get_ensemble_prediction(fighter_a: str, fighter_b: str, model_type: str = "ensemble", sim_runs: int = 1000):
    """
    Returns win probabilities using the selected model type:
    - "ml" → machine learning model
    - "sim" → simulation engine
    - "ensemble" → blended average
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

    # Blend
    if model_type == "ml":
        final_prob = ml_prob
    elif model_type == "sim":
        final_prob = sim_prob
    else:
        # Weighted average (60% ML, 40% Sim)
        final_prob = 0.6 * ml_prob + 0.4 * sim_prob

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
