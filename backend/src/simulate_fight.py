import numpy as np

def simulate_fight(P_A, P_B, P_neutral, num_rounds, name_A=None, name_B=None, num_simulations=1000):
    steps_per_round = 10
    outcomes = []

    for _ in range(num_simulations):
        score_A = 0
        score_B = 0

        for _ in range(num_rounds):
            rand_vals = np.random.rand(steps_per_round)
            steps = np.zeros(steps_per_round)

            steps[rand_vals < P_A] = 1
            steps[(rand_vals >= P_A) & (rand_vals < P_A + P_neutral)] = 0
            steps[rand_vals >= P_A + P_neutral] = -1

            round_score = np.sum(steps)

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
        name_A: (n_A / num_simulations) * 100,
        name_B: (n_B / num_simulations) * 100,
        "Draw": (n_D / num_simulations) * 100
    }
