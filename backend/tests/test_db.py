import os
from datetime import datetime

os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from src.db import init_db, SessionLocal, Fighter
from src.fighter_scraper import save_fighter_to_db

init_db()

sample = {
    'name': 'Test Fighter',
    'profile_url': 'http://example.com',
    'image_url': 'http://img.com/img.jpg',
    'slpm': 1.0,
    'str_acc': 0.5,
    'str_def': 0.5,
    'td_avg': 1.0,
    'td_acc': 0.5,
    'td_def': 0.5,
    'sub_avg': 0.2,
    'last_updated': datetime.utcnow(),
}

def test_save_and_query_fighter():
    save_fighter_to_db(sample)
    db = SessionLocal()
    fighter = db.query(Fighter).filter_by(name='Test Fighter').first()
    db.close()
    assert fighter is not None
    assert fighter.profile_url == 'http://example.com'
