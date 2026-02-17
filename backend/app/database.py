from sqlalchemy import create_engine, Column, String, Float, Integer
from sqlalchemy.orm import sessionmaker, declarative_base

# Database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./truth_detector.db"

# Required for FastAPI + SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# -------------------------
# Predictions Table
# -------------------------
class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, index=True)
    text = Column(String, nullable=False)
    ai_label = Column(String, nullable=False)
    fake_probability = Column(Float, nullable=False)
    reasoning = Column(String, nullable=True)


# -------------------------
# Votes Table
# -------------------------
class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(String, index=True)
    ai_label = Column(String)
    user_vote = Column(String)


# Create tables
Base.metadata.create_all(bind=engine)
