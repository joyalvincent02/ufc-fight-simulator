# MMA Math

A web app for simulating and predicting MMA fight outcomes. It is split into two folders:

- **backend** – FastAPI service that scrapes fighter data from [UFCStats.com](http://ufcstats.com), stores statistics in a database, and exposes simulation and prediction endpoints.
- **frontend** – React + TypeScript + Vite client built with Tailwind CSS and Material UI.

## Prediction models

The backend supports three prediction modes selectable per request:

| Mode | Description |
|---|---|
| `sim` | Round-by-round Monte Carlo simulation using scraped striking and grappling statistics |
| `ml` | Trained XGBoost classifier using historical fighter stat differentials |
| `ensemble` | Weighted combination of the simulation and ML models (default) |

A background scheduler automatically scrapes completed event results, updates prediction outcomes, and periodically retrains the ML model.

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (the backend uses PostgreSQL; a `DATABASE_URL` environment variable must be set before running)

## Quick start

1. **Backend**
   ```
   cd backend
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS / Linux:
   source .venv/bin/activate

   pip install -r requirements.txt
   ```

   Create a `.env` file in `backend/` with at least:
   ```
   DATABASE_URL=postgresql+psycopg2://<user>:<password>@<host>:<port>/<dbname>
   ALLOWED_ORIGINS=http://localhost:5173
   ```

   Then initialise the database and start the server:
   ```
   python init_db.py
   uvicorn main:app --reload
   ```
   The API listens on `http://localhost:8000`.

2. **Frontend**
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Open the printed URL in your browser. The API base URL defaults to `http://localhost:8000`.

## Running tests

```
pip install -r backend/requirements.txt pytest-asyncio
PYTHONPATH=backend DATABASE_URL=sqlite:///test.db pytest
```

## Project structure

```
backend/
  main.py          Entry point – FastAPI app and all route handlers
  init_db.py       Creates database tables
  requirements.txt Core dependencies (use requirements-full.txt for extras)
  src/
    db.py                Database models and session setup (SQLAlchemy)
    fight_model.py       Exchange probability calculations
    simulate_fight.py    Monte Carlo fight simulation
    fighter_scraper.py   Scrapes per-fighter statistics from UFCStats.com
    ufc_scraper.py       Scrapes event cards and results
    ensemble_predict.py  Combines sim and ML predictions
    ufc_scheduler.py     APScheduler jobs for auto-scraping and retraining
    ml/                  XGBoost model training and inference

frontend/
  src/
    pages/         One component per route (Home, Events, Simulate, Custom, Models, Results)
```

## Key API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/events` | Upcoming and recently completed events |
| `GET` | `/simulate-event/{event_id}` | Predict all fights on a card (`?model=sim\|ml\|ensemble`) |
| `POST` | `/simulate-custom` | Predict a custom matchup between any two stored fighters |
| `GET` | `/fighters` | List all fighters in the database |
| `GET` | `/model-performance` | Overall and per-model prediction accuracy |
| `GET` | `/model-performance/detailed` | Full prediction history with results |
| `POST` | `/update-fight-result` | Record the actual winner of a fight |
| `POST` | `/retrain-ml-model` | Manually trigger ML model retraining |
| `GET` | `/scheduler/status` | Background scheduler status |
