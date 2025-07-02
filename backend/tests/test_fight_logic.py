# backend/tests/test_fight_logic.py

import unittest
import numpy as np
from types import SimpleNamespace
from src.fight_model import calculate_exchange_probabilities
from src.simulate_fight import simulate_fight

class TestFightLogic(unittest.TestCase):

    def setUp(self):
        np.random.seed(42)

        self.fighter_a = SimpleNamespace(
            name="Fighter A",
            slpm=5.0,
            str_acc=0.50,
            str_def=0.60,
            td_avg=1.0,
            td_acc=0.40,
            td_def=0.75,
            sub_avg=0.5
        )

        self.fighter_b = SimpleNamespace(
            name="Fighter B",
            slpm=3.0,
            str_acc=0.45,
            str_def=0.55,
            td_avg=0.8,
            td_acc=0.35,
            td_def=0.65,
            sub_avg=0.2
        )

    def test_exchange_probability_output(self):
        P_A, P_B, P_N = calculate_exchange_probabilities(self.fighter_a, self.fighter_b)
        total = P_A + P_B + P_N
        self.assertAlmostEqual(total, 1.0, places=4)
        self.assertTrue(0 <= P_A <= 1)
        self.assertTrue(0 <= P_B <= 1)
        self.assertTrue(0 <= P_N <= 1)

    def test_simulate_fight_result_keys(self):
        P_A, P_B, P_N = calculate_exchange_probabilities(self.fighter_a, self.fighter_b)
        result = simulate_fight(P_A, P_B, P_N, num_rounds=3, name_A=self.fighter_a.name, name_B=self.fighter_b.name)
        self.assertIn(self.fighter_a.name, result)
        self.assertIn(self.fighter_b.name, result)
        self.assertIn("Draw", result)

    def test_simulate_fight_draw_possible(self):
        P_A, P_B, P_N = calculate_exchange_probabilities(self.fighter_a, self.fighter_a)
        draws = 0
        for _ in range(100):
            result = simulate_fight(P_A, P_B, P_N, num_rounds=3, name_A=self.fighter_a.name, name_B=self.fighter_a.name)
            if result["Draw"] > 0:
                draws += 1
        self.assertGreater(draws, 0)

if __name__ == "__main__":
    unittest.main()
