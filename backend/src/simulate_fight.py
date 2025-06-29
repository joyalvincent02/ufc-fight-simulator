import numpy as np
from collections import Counter

def simulate_fight(P_A, P_B, P_neutral, num_rounds, name_A, name_B,
                   num_simulations=1000, steps_per_round=10):
    """
    Simulates multiple UFC fights between two fighters using biased random walk logic.

    Args:
        P_A (float): Probability Fighter A wins an exchange
        P_B (float): Probability Fighter B wins an exchange
        P_neutral (float): Probability of a neutral exchange
        num_rounds (int): Number of rounds (typically 3 or 5)
        name_A (str): Name of Fighter A
        name_B (str): Name of Fighter B
        num_simulations (int): Number of fights to simulate
        steps_per_round (int): Number of exchanges per round

    Returns:
        dict: {'Fighter A': win %, 'Fighter B': win %, 'Draw': draw %}
    """
    outcomes = []

    for _ in range(num_simulations):
        score_A = 0
        score_B = 0

        for _ in range(num_rounds):
            rand_vals = np.random.rand(steps_per_round)
            steps = np.zeros(steps_per_round)

            # Assign outcomes for each exchange
            steps[rand_vals < P_A] = 1
            steps[(rand_vals >= P_A) & (rand_vals < P_A + P_neutral)] = 0
            steps[rand_vals >= P_A + P_neutral] = -1

            round_score = np.sum(steps)

            # Apply 10-point must scoring
            if round_score > 0:
                score_A += 10
                score_B += 9
            elif round_score < 0:
                score_A += 9
                score_B += 10
            else:
                score_A += 10
                score_B += 10

        # Determine winner
        if score_A > score_B:
            outcomes.append(name_A)
        elif score_B > score_A:
            outcomes.append(name_B)
        else:
            outcomes.append("Draw")

    counts = Counter(outcomes)
    results = {
        name_A: (counts[name_A] / num_simulations) * 100,
        name_B: (counts[name_B] / num_simulations) * 100,
        "Draw": (counts["Draw"] / num_simulations) * 100,
    }

    return results
