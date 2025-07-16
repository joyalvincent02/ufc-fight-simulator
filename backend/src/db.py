from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer, Date, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Use Azure-compatible database URL
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL is None:
    # Local development fallback
    from src.azure_config import get_database_path
    DATABASE_URL = get_database_path()

print(f"Main DB - Using database: {DATABASE_URL[:50] if DATABASE_URL else 'None'}...")

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


class SchedulerMetadata(Base):
    __tablename__ = "scheduler_metadata"

    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)


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
    age_diff: int = None,
    allow_duplicates: bool = False
):
    """Log a model prediction to the database with duplicate prevention"""
    db = SessionLocal()
    try:
        # Check for existing prediction unless duplicates are explicitly allowed
        if not allow_duplicates:
            existing = db.query(ModelPrediction).filter(
                ((ModelPrediction.fighter_a == fighter_a) & (ModelPrediction.fighter_b == fighter_b) & (ModelPrediction.model == model)) |
                ((ModelPrediction.fighter_a == fighter_b) & (ModelPrediction.fighter_b == fighter_a) & (ModelPrediction.model == model))
            ).first()
            
            if existing:
                print(f"Prediction already exists for {fighter_a} vs {fighter_b} ({model}), skipping...")
                return existing.id
        
        # Ensure all numeric values are native Python types (not numpy)
        def safe_convert_float(value):
            if value is None:
                return None
            return float(value) if hasattr(value, 'item') else float(value)
        
        def safe_convert_int(value):
            if value is None:
                return None
            return int(value) if hasattr(value, 'item') else int(value)
        
        prediction = ModelPrediction(
            fighter_a=fighter_a,
            fighter_b=fighter_b,
            model=model,
            predicted_winner=predicted_winner,
            fighter_a_prob=safe_convert_float(fighter_a_prob),
            fighter_b_prob=safe_convert_float(fighter_b_prob),
            draw_prob=safe_convert_float(draw_prob),
            penalty_score=safe_convert_float(penalty_score),
            weight_diff=safe_convert_int(weight_diff),
            height_diff=safe_convert_int(height_diff),
            reach_diff=safe_convert_int(reach_diff),
            age_diff=safe_convert_int(age_diff),
            timestamp=datetime.utcnow()
        )
        db.add(prediction)
        db.commit()
        return prediction.id
    except Exception as e:
        db.rollback()
        print(f"Error logging prediction: {e}")
        # Print detailed type information for debugging
        import numpy as np
        print(f"Type debugging - fighter_a_prob: {type(fighter_a_prob)}, value: {fighter_a_prob}")
        if hasattr(fighter_a_prob, 'dtype'):
            print(f"NumPy dtype: {fighter_a_prob.dtype}")
        return None
    finally:
        db.close()
