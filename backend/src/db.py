from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer, Date
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

    # 🆕 New physical/statistical attributes
    height = Column(Integer, nullable=True)   # in inches
    weight = Column(Integer, nullable=True)   # in lbs
    reach = Column(Integer, nullable=True)    # in inches
    stance = Column(String, nullable=True)
    dob = Column(Date, nullable=True)
