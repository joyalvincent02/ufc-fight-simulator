import json
import argparse
import os
import sys

# Add src directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "src")))

from fight_model import calculate_exchange_probabilities
from simulate_fight import simulate_fight

def load_stats(filepath):
    with open(filepath, "r") as file:
        data = json.load(file)
    stats_A = data["FighterA"]
    stats_B = data["FighterB"]
    return stats_A, stats_B

def main():
    parser = argparse.ArgumentParser(description="Simulate a UFC fight using a biased random walk model.")
    parser.add_argument("file", help="Path to JSON file with fighter stats (e.g. data/topuria_vs_oliveira.json)")
    parser.add_argument("--rounds", type=int, default=5, help="Number of rounds (default: 5)")
    args = parser.parse_args()

    stats_A, stats_B = load_stats(args.file)
    name_A = stats_A["Name"]
    name_B = stats_B["Name"]

    P_A, P_B, P_neutral = calculate_exchange_probabilities(stats_A, stats_B)

    print("\n📊 Exchange Probabilities")
    print(f"{name_A}: {P_A:.3f}")
    print(f"{name_B}: {P_B:.3f}")
    print(f"Neutral: {P_neutral:.3f}")

    results = simulate_fight(P_A, P_B, P_neutral, num_rounds=args.rounds, name_A=name_A, name_B=name_B)

    print("\n🧪 Simulation Results (1000 Fights)")
    for fighter, percentage in results.items():
        print(f"{fighter}: {percentage:.1f}%")

if __name__ == "__main__":
    main()
