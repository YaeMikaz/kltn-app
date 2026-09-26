# app/database.py
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Mặc định sử dụng SQLite cục bộ nếu không cấu hình DATABASE_URL (không cần cài hay bật PostgreSQL)
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./kltn.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()