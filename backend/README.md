# MMA Math – Backend

FastAPI service that scrapes fighter statistics from [UFCStats.com](http://ufcstats.com), stores them in PostgreSQL, and exposes fight simulation and ML prediction endpoints.

## Tech stack

- **FastAPI** – API framework
- **SQLAlchemy** – ORM (PostgreSQL in production, SQLite supported for testing)
- **APScheduler** – background jobs for auto-scraping results and retraining the ML model
- **XGBoost + scikit-learn** – ML prediction model
- **BeautifulSoup** – HTML scraping
- **Gunicorn + Uvicorn** – production WSGI/ASGI server

## Prerequisites

- Python 3.10+
- A running PostgreSQL instance

## Setup

```bash
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in this directory:

```
DATABASE_URL=postgresql+psycopg2://<user>:<password>@<host>:<port>/<dbname>
ALLOWED_ORIGINS=http://localhost:5173
```

Initialise the database tables:

```bash
python init_db.py
```

Start the development server:

```bash
uvicorn main:app --reload
```

The API is available at `http://localhost:8000`. Interactive docs are at `http://localhost:8000/docs`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLAlchemy-compatible connection string |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed CORS origins (defaults to `*`) |
| `ENVIRONMENT` | No | Set to `production` to disable debug endpoints (default: `production`) |

## Running tests

```bash
pip install pytest pytest-asyncio
PYTHONPATH=backend DATABASE_URL=sqlite:///test.db pytest
```

## Project structure

```
main.py                  FastAPI app – all route handlers
init_db.py               Creates database tables
requirements.txt         Core dependencies
requirements-full.txt    Extended dependencies (includes extras for local dev)

src/
  db.py                  SQLAlchemy models: Fighter, ModelPrediction, FightResult
  fight_model.py         Exchange probability calculations (striking, grappling stats)
  simulate_fight.py      Monte Carlo round-by-round fight simulation
  fighter_scraper.py     Scrapes per-fighter stats from UFCStats.com
  ufc_scraper.py         Scrapes event cards, fight cards, and results
  ensemble_predict.py    Combines sim + ML predictions into a weighted ensemble
  ufc_scheduler.py       APScheduler jobs (auto-scrape, retrain, cleanup)
  azure_config.py        Azure-specific config helpers

  ml/
    train_model.py           Trains the XGBoost model on historical data
    ml_predict.py            Runs inference with the trained model
    prepare_ml_dataset.py    Builds the training dataset from the database
    scrape_fighter_outcomes.py  Scrapes historical fight outcomes
    fight_predictor.pkl      Serialised trained model

data/                    Per-event JSON data files
tests/                   pytest test suite
```

## Database schema

| Table | Description |
|---|---|
| `fighters` | Scraped fighter stats (striking, grappling, physical attributes) |
| `model_predictions` | Every prediction made, with actual result once available |
| `fight_results` | Raw scraped fight outcome records |

## Background scheduler

The scheduler starts automatically with the app and runs the following jobs:

- **Check completed events** – scrapes results for events that have finished and updates `model_predictions.correct`
- **Check new events** – detects newly listed upcoming events
- **Retrain ML model** – retrains the XGBoost model when enough new labelled results accumulate
- **Cleanup old predictions** – removes stale pending predictions for events that never resolved

Scheduler state is accessible at `GET /scheduler/status`. Jobs can be triggered manually via `POST /scheduler/check-results`, `/scheduler/check-events`, and `/scheduler/cleanup-old-predictions`.

## Deployment

The backend is deployed to **Azure Web App** (`mma-math`) on every push to `master` via `.github/workflows/master_mma-math.yml`. The production server command is:

```
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

After deployment the workflow automatically calls `POST /retrain-ml-model?min_new_results=0` to ensure the model is compatible with the current package versions on the new instance.
