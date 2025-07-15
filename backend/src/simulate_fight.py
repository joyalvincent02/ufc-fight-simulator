import numpy as np

def simulate_fight(P_A, P_B, P_neutral, num_rounds, name_A=None, name_B=None, num_simulations=1000):
    steps_per_round = 10
    outcomes = []

    for _ in range(num_simulations):
        score_A = 0
        score_B = 0
        
        # Initialize fatigue and momentum factors
        fatigue_A = 1.0
        fatigue_B = 1.0
        momentum_A = 1.0
        momentum_B = 1.0

        for round_num in range(num_rounds):
            # Apply fatigue (increases each round)
            fatigue_factor = 1.0 - (round_num * 0.05)  # 5% reduction per round
            current_fatigue_A = fatigue_A * fatigue_factor
            current_fatigue_B = fatigue_B * fatigue_factor
            
            # Adjust probabilities based on fatigue and momentum
            adjusted_P_A = P_A * current_fatigue_A * momentum_A
            adjusted_P_B = P_B * current_fatigue_B * momentum_B
            
            # Normalize probabilities to ensure they sum correctly
            total_P = adjusted_P_A + adjusted_P_B + P_neutral
            if total_P > 1.0:
                adjusted_P_A /= total_P
                adjusted_P_B /= total_P
                adjusted_P_neutral = P_neutral / total_P
            else:
                adjusted_P_neutral = P_neutral
            
            rand_vals = np.random.rand(steps_per_round)
            steps = np.zeros(steps_per_round)

            steps[rand_vals < adjusted_P_A] = 1
            steps[(rand_vals >= adjusted_P_A) & (rand_vals < adjusted_P_A + adjusted_P_neutral)] = 0
            steps[rand_vals >= adjusted_P_A + adjusted_P_neutral] = -1

            round_score = np.sum(steps)

            # Update momentum based on round performance
            if round_score > 2:  # Strong round for A
                momentum_A = min(momentum_A * 1.1, 1.3)  # Cap at 30% boost
                momentum_B = max(momentum_B * 0.95, 0.8)  # Min 20% reduction
            elif round_score < -2:  # Strong round for B
                momentum_B = min(momentum_B * 1.1, 1.3)
                momentum_A = max(momentum_A * 0.95, 0.8)
            else:  # Close round
                momentum_A = 0.98 * momentum_A + 0.02 * 1.0  # Gradual return to baseline
                momentum_B = 0.98 * momentum_B + 0.02 * 1.0

            # Score the round
            if round_score > 0:
                score_A += 10
                score_B += 9
            elif round_score < 0:
                score_A += 9
                score_B += 10
            else:
                score_A += 10
                score_B += 10

        if score_A > score_B:
            outcomes.append(name_A)
        elif score_B > score_A:
            outcomes.append(name_B)
        else:
            outcomes.append("Draw")

    n_A = outcomes.count(name_A)
    n_B = outcomes.count(name_B)
    n_D = outcomes.count("Draw")

    return {
        name_A: float((n_A / num_simulations) * 100),
        name_B: float((n_B / num_simulations) * 100),
        "Draw": float((n_D / num_simulations) * 100)
    }
