# migrate.py
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, SensorReading
from app.database import DATABASE_URL

# SQLite local connection
sqlite_engine = create_engine("sqlite:///./kltn.db")
SQLiteSession = sessionmaker(bind=sqlite_engine)

# Supabase PostgreSQL connection
postgres_engine = create_engine(DATABASE_URL)
PostgresSession = sessionmaker(bind=postgres_engine)

print("Đang tạo bảng trên Supabase...")
Base.metadata.create_all(bind=postgres_engine)

print("Đang đọc dữ liệu từ SQLite cục bộ...")
sqlite_db = SQLiteSession()
rows = sqlite_db.query(SensorReading).all()
sqlite_db.close()

print(f"Tìm thấy {len(rows)} bản ghi. Đang đẩy lên Supabase...")
postgres_db = PostgresSession()

for row in rows:
    new_record = SensorReading(
        id=row.id,
        timestamp=row.timestamp,
        ec=row.ec,
        moisture=row.moisture,
        temperature=row.temperature,
        n_estimate=row.n_estimate
    )
    postgres_db.merge(new_record) # merge handles potential primary key conflicts

postgres_db.commit()
postgres_db.close()
print("Migration thành công!")
