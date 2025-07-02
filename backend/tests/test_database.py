# backend/tests/test_database.py

import unittest
import os
import sys
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend and src to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from db import Base, Fighter
from fighter_scraper import save_fighter_to_db

class TestDatabaseInteraction(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Set up an in-memory SQLite database
        cls.engine = create_engine('sqlite:///:memory:')
        cls.SessionTest = sessionmaker(bind=cls.engine)
        Base.metadata.create_all(cls.engine)

        # Monkey patch the real session with test session
        import fighter_scraper
        fighter_scraper.SessionLocal = cls.SessionTest

    def test_save_new_fighter(self):
        sample_data = {
            "name": "Test Fighter",
            "profile_url": "https://ufcstats.com/fighter/test-fighter",
            "image_url": "https://ufc.com/test.jpg",
            "slpm": 5.0,
            "str_acc": 0.45,
            "str_def": 0.55,
            "td_avg": 1.2,
            "td_acc": 0.4,
            "td_def": 0.75,
            "sub_avg": 0.6,
            "last_updated": datetime.utcnow()
        }

        save_fighter_to_db(sample_data)

        session = self.SessionTest()
        fighter = session.query(Fighter).filter(Fighter.name == "Test Fighter").first()
        self.assertIsNotNone(fighter)
        self.assertEqual(fighter.name, "Test Fighter")
        session.close()

    def test_update_existing_fighter_image_url(self):
        session = self.SessionTest()
        # Insert without image first
        fighter = Fighter(
            name="Image Update",
            profile_url="https://ufcstats.com/fighter/image-update",
            image_url=None,
            slpm=3.0, str_acc=0.4, str_def=0.5,
            td_avg=0.5, td_acc=0.3, td_def=0.6,
            sub_avg=0.3,
            last_updated=datetime.utcnow()
        )
        session.add(fighter)
        session.commit()
        session.close()

        updated_data = {
            "name": "Image Update",
            "profile_url": "https://ufcstats.com/fighter/image-update",
            "image_url": "https://ufc.com/updated.jpg",
            "slpm": 3.0, "str_acc": 0.4, "str_def": 0.5,
            "td_avg": 0.5, "td_acc": 0.3, "td_def": 0.6,
            "sub_avg": 0.3,
            "last_updated": datetime.utcnow()
        }

        save_fighter_to_db(updated_data)

        session = self.SessionTest()
        fighter = session.query(Fighter).filter(Fighter.name == "Image Update").first()
        self.assertEqual(fighter.image_url, "https://ufc.com/updated.jpg")
        session.close()

if __name__ == "__main__":
    unittest.main()
