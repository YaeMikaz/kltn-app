# app/services/classifier.py
"""
Service suy luận nhận diện bệnh cây trồng sử dụng mô hình EfficientNet-B0 (PyTorch).
"""

import json
import os
from io import BytesIO
from typing import List, Dict, Any

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

from app.services.knowledge import get_disease_info

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(os.path.dirname(CURRENT_DIR), "ml")
MODEL_PATH = os.path.join(MODEL_DIR, "plant_disease_model.pth")
CLASS_NAMES_PATH = os.path.join(MODEL_DIR, "class_names.json")

# 1. Load danh sách nhãn lớp
with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
    CLASS_NAMES: List[str] = json.load(f)

NUM_CLASSES = len(CLASS_NAMES)

# 2. Khởi tạo và nạp trọng số mô hình một lần duy nhất khi import
checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
model = models.efficientnet_b0(weights=None)
model.classifier = nn.Sequential(
    nn.Dropout(0.3),
    nn.Linear(model.classifier[1].in_features, NUM_CLASSES)
)
model.load_state_dict(checkpoint["model_state"])
model.to(DEVICE)
model.eval()

# 3. Pipeline tiền xử lý ảnh
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])


def predict_disease(image_bytes: bytes) -> Dict[str, Any]:
    """
    Nhận dữ liệu byte ảnh, tiền xử lý, suy luận qua mô hình CNN và trả về kết quả tiếng Việt.
    """
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    tensor = TRANSFORM(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.softmax(outputs, dim=1)[0]
        topk = torch.topk(probs, k=min(3, NUM_CLASSES))

    # Xây dựng danh sách top 3
    top3_list = []
    for i in range(len(topk.indices)):
        idx = topk.indices[i].item()
        score = topk.values[i].item()
        raw_label = CLASS_NAMES[idx]
        info = get_disease_info(raw_label)
        top3_list.append({
            "name": f"{info['plant']} - {info['disease']}",
            "raw_name": raw_label,
            "confidence": round(score, 4),
        })

    # Kết quả dự đoán cao nhất (Top 1)
    best_raw = CLASS_NAMES[topk.indices[0].item()]
    best_info = get_disease_info(best_raw)
    best_conf = round(topk.values[0].item(), 4)

    return {
        "plant": best_info["plant"],
        "disease": best_info["disease"],
        "confidence": best_conf,
        "severity": best_info["severity"],
        "recommendation": best_info["recommendation"],
        "top3": top3_list,
    }
