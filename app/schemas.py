# app/schemas.py
from pydantic import BaseModel
from datetime import datetime

class SensorIn(BaseModel):
    ec: float
    moisture: float
    temperature: float
    n_estimate: float

class SensorOut(SensorIn):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


class ClassifyResponse(BaseModel):
    plant: str
    disease: str
    confidence: float
    severity: str
    recommendation: str