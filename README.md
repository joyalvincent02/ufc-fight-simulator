# UFC Fight Simulator

This project contains a simple web app for simulating UFC fights. It is split into
two folders:

- **backend** – FastAPI service that scrapes fighter data from [UFCStats.com](http://ufcstats.com) and provides simulation endpoints.
- **frontend** – React + TypeScript + Vite client for interacting with the API.

The backend stores fighter statistics using SQLite by default but can be pointed at
another SQLAlchemy compatible database via `DATABASE_URL`.

## Quick start

1. **Backend**
   ```
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python init_db.py       # create database tables
   uvicorn main:app --reload
   ```
   The server listens on `http://localhost:8000`.

2. **Frontend**
   ```
   cd frontend
   npm install
   # API base URL defaults to http://localhost:8000
   npm run dev
   ```
   Open the printed URL in your browser to use the interface.

## Running tests

The backend includes a small test suite. Install test requirements then run `pytest`:

```
pip install -r backend/requirements.txt pytest-asyncio
PYTHONPATH=backend DATABASE_URL=sqlite:///test.db pytest
```

## Project structure

```
backend/   FastAPI application and scraping logic
frontend/  React client built with Vite + Tailwind CSS
```

See `frontend/src/pages` for UI pages and `backend/src` for core simulation code.
