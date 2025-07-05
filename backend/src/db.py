from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer, Date, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/fighter_stats.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Fighter(Base):
    __tablename__ = "fighters"

    name = Column(String, primary_key=True, index=True)
    profile_url = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    slpm = Column(Float)
    str_acc = Column(Float)
    str_def = Column(Float)
    td_avg = Column(Float)
    td_acc = Column(Float)
    td_def = Column(Float)
    sub_avg = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow)

    # Physical/statistical attributes
    height = Column(Integer, nullable=True)   # in inches
    weight = Column(Integer, nullable=True)   # in lbs
    reach = Column(Integer, nullable=True)    # in inches
    stance = Column(String, nullable=True)
    dob = Column(Date, nullable=True)


class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, index=True)
    fighter_a = Column(String, nullable=False)
    fighter_b = Column(String, nullable=False)
    model = Column(String, nullable=False)  # "ml", "ensemble", or "sim"
    predicted_winner = Column(String, nullable=False)
    actual_winner = Column(String, nullable=True)
    correct = Column(Boolean, nullable=True)
    fighter_a_prob = Column(Float, nullable=True)
    fighter_b_prob = Column(Float, nullable=True)
    draw_prob = Column(Float, nullable=True)
    penalty_score = Column(Float, nullable=True)
    weight_diff = Column(Integer, nullable=True)
    height_diff = Column(Integer, nullable=True)
    reach_diff = Column(Integer, nullable=True)
    age_diff = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class FightResult(Base):
    __tablename__ = "fight_results"

    id = Column(Integer, primary_key=True, index=True)
    fighter_name = Column(String, nullable=False)  # Main fighter
    opponent_name = Column(String, nullable=False)  # Opponent
    result = Column(String, nullable=False)  # "win", "loss", "draw"
    method = Column(String, nullable=True)
    round = Column(String, nullable=True)
    time = Column(String, nullable=True)
    event = Column(String, nullable=True)
    event_date = Column(String, nullable=True)  # Keep as string to match existing


# Create all tables
Base.metadata.create_all(bind=engine)


def log_prediction(
    fighter_a: str,
    fighter_b: str,
    model: str,
    predicted_winner: str,
    fighter_a_prob: float = None,
    fighter_b_prob: float = None,
    draw_prob: float = None,
    penalty_score: float = None,
    weight_diff: int = None,
    height_diff: int = None,
    reach_diff: int = None,
    age_diff: int = None
):
    """Log a model prediction to the database"""
    db = SessionLocal()
    try:
        prediction = ModelPrediction(
            fighter_a=fighter_a,
            fighter_b=fighter_b,
            model=model,
            predicted_winner=predicted_winner,
            fighter_a_prob=fighter_a_prob,
            fighter_b_prob=fighter_b_prob,
            draw_prob=draw_prob,
            penalty_score=penalty_score,
            weight_diff=weight_diff,
            height_diff=height_diff,
            reach_diff=reach_diff,
            age_diff=age_diff,
            timestamp=datetime.utcnow()
        )
        db.add(prediction)
        db.commit()
        return prediction.id
    except Exception as e:
        db.rollback()
        print(f"Error logging prediction: {e}")
        return None
    finally:
        db.close()
