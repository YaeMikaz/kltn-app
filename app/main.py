# app/main.py
import os
from statistics import fmean
from typing import List, Optional

from fastapi import FastAPI, Depends, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import get_db, engine
from app.models import SensorReading, Base
from app.schemas import (
    ClassifyResponse,
    ChatRequest,
    ChatResponse,
    SensorIn,
    SensorOut,
)
from app.services.classifier import predict_disease

Base.metadata.create_all(bind=engine)

app = FastAPI(title="KLTN AI & IoT API")

# Cấu hình CORS để trình duyệt web và thiết bị di động có thể gọi API mà không bị chặn OPTIONS request
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/image/classify", response_model=ClassifyResponse)
async def classify_image(file: UploadFile = File(...)):
    """
    Nhận diện bệnh hại trên lá cây bằng mô hình EfficientNet-B0 CNN.
    """
    try:
        if file.content_type not in {"image/jpeg", "image/png", "image/jpg", "application/octet-stream"}:
            raise HTTPException(
                status_code=400,
                detail="Chỉ chấp nhận file ảnh định dạng JPEG hoặc PNG",
            )

        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="File ảnh rỗng")

        result = predict_disease(image_bytes)
        return ClassifyResponse(**result)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi xử lý nhận diện ảnh: {error}",
        ) from error


@app.post("/sensor-data", response_model=SensorOut)
def create_reading(data: SensorIn, db: Session = Depends(get_db)):
    record = SensorReading(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/sensor-data/latest", response_model=Optional[SensorOut])
def get_latest(db: Session = Depends(get_db)):
    return db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()


@app.get("/sensor-data/history", response_model=List[SensorOut])
def get_history(db: Session = Depends(get_db)):
    return db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(50).all()


@app.post("/chat", response_model=ChatResponse)
def chat(data: ChatRequest, db: Session = Depends(get_db)):
    # Đánh giá chính xác include_sensors
    should_include = True
    if data.include_sensors is False or str(data.include_sensors).strip().lower() in ("false", "0", "no", "off"):
        should_include = False

    target_plant = data.plant if data.plant else "cải bẹ xanh"
    target_disease = data.disease if data.disease else "bệnh cây trồng"

    system_prompt = f"""
Bạn là chuyên gia bảo vệ thực vật và nông nghiệp tư vấn cho cây {target_plant} đang gặp vấn đề về {target_disease}.
BẮT BUỘC TUÂN THỦ CÁC QUY TẮC SAU:
1. BẮT BUỘC viết hoàn toàn bằng TIẾNG VIỆT CHUẨN CÓ DẤU ĐẦY ĐỦ (tuyệt đối KHÔNG viết không dấu, KHÔNG dùng tiếng Anh).
2. Chỉ trả về văn bản thuần (plain text), không dùng LaTeX, không dùng định dạng Markdown, không dùng dấu sao, không emoji.
3. Trình bày tối đa 4 dòng, mỗi dòng ngắn gọn, súc tích, tập trung vào nguyên nhân bệnh và loại thuốc/biện pháp điều trị đặc hiệu cho {target_plant}.
4. Dòng cuối cùng luôn là khuyến nghị hành động cụ thể cho người nông dân trong 24 giờ tới.
"""

    if should_include:
        readings = (
            db.query(SensorReading)
            .order_by(SensorReading.timestamp.desc())
            .limit(10)
            .all()
        )
        if readings:
            averages = {
                "ec": fmean(reading.ec for reading in readings),
                "moisture": fmean(reading.moisture for reading in readings),
                "temperature": fmean(reading.temperature for reading in readings),
                "n_estimate": fmean(reading.n_estimate for reading in readings),
            }
            system_prompt = f"""
Bạn là chuyên gia nông nghiệp tư vấn trồng {target_plant}.
BẮT BUỘC TUÂN THỦ CÁC QUY TẮC SAU:
1. BẮT BUỘC viết hoàn toàn bằng TIẾNG VIỆT CHUẨN CÓ DẤU ĐẦY ĐỦ (tuyệt đối KHÔNG viết không dấu).
2. Chỉ trả về văn bản thuần, không dùng LaTeX, không dùng Markdown, không dấu sao, không emoji.
3. Tối đa 4 dòng, mỗi dòng ngắn gọn, dễ hiểu.
4. Nếu có số liệu thì ghi theo dạng: "EC: 1.2 mS/cm".
5. Dòng cuối luôn là khuyến nghị hành động cụ thể cho 24 giờ tới.

Dữ liệu cảm biến trung bình đo được từ vườn {target_plant}:
- EC trung bình: {averages['ec']:.2f} mS/cm
- Độ ẩm trung bình: {averages['moisture']:.2f} %
- Nhiệt độ trung bình: {averages['temperature']:.2f} °C
- Dinh dưỡng N ước lượng: {averages['n_estimate']:.2f}
"""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Chưa cấu hình biến môi trường GEMINI_API_KEY")

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-3.5-flash-lite",
            system_instruction=system_prompt,
        )
        response = model.generate_content(data.question)
        answer = response.text
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Gemini API lỗi: {error}") from error

    return ChatResponse(answer=answer)
