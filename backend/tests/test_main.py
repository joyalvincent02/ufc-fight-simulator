import os
import importlib
from types import SimpleNamespace
import sys
from pathlib import Path

os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from fastapi.testclient import TestClient

# reload modules after setting env var
sys.path.append(str(Path(__file__).resolve().parents[1] / 'backend'))
import src.db as db
import src.fight_model as fight_model
import src.simulate_fight as simulate_fight
import main as main

client = TestClient(main.app)

def test_root_endpoint():
    resp = client.get('/')
    assert resp.status_code == 200
    assert resp.json() == {"message": "Hello from FastAPI!"}

def test_simulate_endpoint():
    cwd = os.getcwd()
    os.chdir(Path(__file__).resolve().parents[1])
    try:
        resp = client.get('/simulate/topuria_vs_oliveira')
    finally:
        os.chdir(cwd)
    assert resp.status_code == 200
    data = resp.json()
    assert data['fighters'] == ['Topuria', 'Oliveira']
    assert 'results' in data

def test_calculate_exchange_probabilities_sum():
    a = SimpleNamespace(slpm=4, str_acc=0.5, str_def=0.6, td_avg=1, td_acc=0.5, td_def=0.5, sub_avg=0.1)
    b = SimpleNamespace(slpm=3, str_acc=0.6, str_def=0.5, td_avg=1, td_acc=0.4, td_def=0.5, sub_avg=0.2)
    P_A, P_B, P_neutral = fight_model.calculate_exchange_probabilities(a, b)
    total = P_A + P_B + P_neutral
    assert abs(total - 1.0) < 1e-6

def test_simulate_fight_returns_probabilities():
    probs = simulate_fight.simulate_fight(0.3, 0.3, 0.4, 5, name_A='A', name_B='B', num_simulations=50)
    total = probs['A'] + probs['B'] + probs['Draw']
    assert round(total) == 100
