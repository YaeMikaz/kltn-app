# app/main.py
import os
from statistics import fmean

from fastapi import FastAPI, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db, engine
from app.models import SensorReading, Base
from app.schemas import ClassifyResponse, ChatRequest, ChatResponse, SensorIn, SensorOut
from typing import List

Base.metadata.create_all(bind=engine)

app = FastAPI(title="KLTN API")


@app.post("/image/classify", response_model=ClassifyResponse)
async def classify_image(file: UploadFile = File(...)):
    try:
        if file.content_type not in {"image/jpeg", "image/png"}:
            raise HTTPException(
                status_code=400,
                detail="Chỉ chấp nhận file ảnh JPEG hoặc PNG",
            )

        await file.read()

        return ClassifyResponse(
            plant="Cà chua",
            disease="Đốm lá sớm",
            confidence=0.87,
            severity="Trung bình",
            recommendation="Phun thuốc gốc đồng, giảm tưới nước, kiểm tra lại sau 3 ngày",
        )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi không xác định khi phân loại ảnh: {error}",
        ) from error

@app.post("/sensor-data", response_model=SensorOut)
def create_reading(data: SensorIn, db: Session = Depends(get_db)):
    record = SensorReading(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@app.get("/sensor-data/latest", response_model=SensorOut)
def get_latest(db: Session = Depends(get_db)):
    return db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()

@app.get("/sensor-data/history", response_model=List[SensorOut])
def get_history(db: Session = Depends(get_db)):
    return db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(50).all()


@app.post("/chat", response_model=ChatResponse)
def chat(data: ChatRequest, db: Session = Depends(get_db)):
    readings = (
        db.query(SensorReading)
        .order_by(SensorReading.timestamp.desc())
        .limit(10)
        .all()
    )
    if not readings:
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu cảm biến để tư vấn")

    averages = {
        "ec": fmean(reading.ec for reading in readings),
        "moisture": fmean(reading.moisture for reading in readings),
        "temperature": fmean(reading.temperature for reading in readings),
        "n_estimate": fmean(reading.n_estimate for reading in readings),
    }
    system_prompt = f"""
Bạn là chuyên gia nông nghiệp tư vấn trồng cải bẹ xanh.
Dữ liệu cảm biến trung bình của {len(readings)} bản ghi mới nhất:
- EC trung bình: {averages['ec']:.2f}
- Độ ẩm trung bình: {averages['moisture']:.2f}
- Nhiệt độ trung bình: {averages['temperature']:.2f} °C
- N ước lượng trung bình: {averages['n_estimate']:.2f}

Lưu ý: N là ước lượng tương đối từ EC, không phải đo trực tiếp.
Yêu cầu định dạng câu trả lời:
- Ngôn ngữ chính là tiếng Việt có dấu, tuyệt đối không dùng tiếng Việt không dấu.
- Chỉ trả về văn bản thuần, không dùng LaTeX, không dùng Markdown, không emoji.
- Tối đa 4 dòng, mỗi dòng ngắn gọn, dễ hiểu.
- Nếu có số liệu thì ghi theo dạng: "EC: 1.2 mS/cm".
- Dòng cuối luôn là khuyến nghị hành động cụ thể cho 24 giờ tới.

Hãy trả lời thực tế, đơn giản, phù hợp với nông dân nhỏ lẻ.
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