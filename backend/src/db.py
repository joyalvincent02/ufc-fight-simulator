from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Create DB engine (for dev, use SQLite file)
DATABASE_URL = "sqlite:///./data/fighter_stats.db"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)

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

# Create tables (run this once)
def init_db():
    Base.metadata.create_all(bind=engine)
