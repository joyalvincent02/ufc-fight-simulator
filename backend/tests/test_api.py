# backend/tests/test_api.py

import sys
import os

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(base_dir)
sys.path.append(os.path.join(base_dir, 'src'))

import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from src.db import Base, engine, SessionLocal, Fighter


# Setup the test DB (uses the same engine but can be overridden in real CI)
@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    db.query(Fighter).delete()
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.mark.asyncio
async def test_simulate_event_returns_200():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/simulate-event/b8e2f10efb6eca85")
        assert response.status_code == 200
        assert "fights" in response.json()


@pytest.mark.asyncio
async def test_refresh_images_returns_200():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/refresh-images")
        assert response.status_code == 200
        assert "updated" in response.json()


@pytest.mark.asyncio
async def test_get_events_returns_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
