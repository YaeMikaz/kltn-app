# app/models.py
from sqlalchemy import Column, Integer, Float, DateTime, func
from app.database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id          = Column(Integer, primary_key=True, index=True)
    timestamp   = Column(DateTime(timezone=True), server_default=func.now())
    ec          = Column(Float)
    moisture    = Column(Float)
    temperature = Column(Float)
    n_estimate  = Column(Float)