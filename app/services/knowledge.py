# app/services/knowledge.py
"""
Bảng tra cứu tri thức bệnh cây trồng cho 15 nhãn của mô hình CNN.
Cung cấp thông tin tên tiếng Việt, độ nghiêm trọng và khuyến nghị xử lý.
"""

DISEASE_KNOWLEDGE = {
    # --- Ớt chuông (Pepper Bell) ---
    "Pepper,_bell___Bacterial_spot": {
        "plant": "Ớt chuông",
        "disease": "Đốm lá vi khuẩn",
        "severity": "Trung bình",
        "recommendation": "Phun thuốc gốc đồng (Copper Hydroxide hoặc Kasugamycin). Cắt bỏ lá bị bệnh, tránh tưới phun mưa lên tán lá.",
    },
    "Pepper,_bell___healthy": {
        "plant": "Ớt chuông",
        "disease": "Cây khỏe mạnh",
        "severity": "Bình thường",
        "recommendation": "Cây phát triển tốt, không có dấu hiệu bệnh. Duy trì độ ẩm đất và bón phân định kỳ theo quy trình.",
    },

    # --- Khoai tây (Potato) ---
    "Potato___Early_blight": {
        "plant": "Khoai tây",
        "disease": "Cháy lá sớm (Early Blight)",
        "severity": "Trung bình",
        "recommendation": "Phun Mancozeb, Chlorothalonil hoặc Difenoconazole. Tỉa bỏ lá già sát gốc, tránh để đất quá ẩm.",
    },
    "Potato___Late_blight": {
        "plant": "Khoai tây",
        "disease": "Mốc sương / Bệnh sương mai (Late Blight)",
        "severity": "Nghiêm trọng",
        "recommendation": "Cần can thiệp ngay: Phun Metalaxyl, Dimethomorph hoặc Cymoxanil. Tiêu hủy triệt để cây bệnh nặng để tránh lây lan nhanh trong vườn.",
    },
    "Potato___healthy": {
        "plant": "Khoai tây",
        "disease": "Cây khỏe mạnh",
        "severity": "Bình thường",
        "recommendation": "Lá khoai tây xanh tốt, không phát hiện sâu bệnh. Tiếp tục theo dõi độ ẩm đất và phòng ngừa định kỳ.",
    },

    # --- Cà chua (Tomato) ---
    "Tomato___Bacterial_spot": {
        "plant": "Cà chua",
        "disease": "Đốm lá vi khuẩn (Bacterial Spot)",
        "severity": "Trung bình",
        "recommendation": "Phun thuốc gốc đồng kết hợp Mancozeb. Không tỉa cành khi lá còn ướt sương, cải thiện thông thoáng luống trồng.",
    },
    "Tomato___Early_blight": {
        "plant": "Cà chua",
        "disease": "Đốm vòng / Cháy lá sớm (Early Blight)",
        "severity": "Trung bình",
        "recommendation": "Phun thuốc luân phiên Azoxystrobin, Mancozeb hoặc Chlorothalonil. Làm sạch tàn dư lá bệnh dưới gốc, giảm độ ẩm mặt đất.",
    },
    "Tomato___Late_blight": {
        "plant": "Cà chua",
        "disease": "Sương mai / Mốc sương (Late Blight)",
        "severity": "Nghiêm trọng",
        "recommendation": "Bệnh lây lan rất nhanh: Phun ngay Metalaxyl, Mancozeb hoặc Fosetyl-Aluminium. Cách ly cây bệnh, giảm tưới nước và giữ vườn khô ráo.",
    },
    "Tomato___Leaf_Mold": {
        "plant": "Cà chua",
        "disease": "Mốc lá cà chua (Leaf Mold)",
        "severity": "Nhẹ",
        "recommendation": "Tăng cường thông gió nhà màng/vườn trồng để giảm ẩm không khí (>85%). Phun thuốc gốc đồng hoặc Chlorothalonil nếu vết bệnh lan rộng.",
    },
    "Tomato___Septoria_leaf_spot": {
        "plant": "Cà chua",
        "disease": "Đốm lá Septoria",
        "severity": "Trung bình",
        "recommendation": "Cắt tỉa lá sát gốc bị đốm đốm xám viền đen. Phun thuốc trừ nấm Chlorothalonil, Mancozeb hoặc gốc đồng.",
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "plant": "Cà chua",
        "disease": "Nhện đỏ hại lá (Two-spotted Spider Mite)",
        "severity": "Trung bình",
        "recommendation": "Phun dầu khoáng sinh học, Abamectin hoặc Fenpyroximate vào mặt dưới của lá. Tăng độ ẩm tán lá để hạn chế nhện phát triển.",
    },
    "Tomato___Target_Spot": {
        "plant": "Cà chua",
        "disease": "Đốm mục tiêu / Đốm mắt cua (Target Spot)",
        "severity": "Trung bình",
        "recommendation": "Phun thuốc Azoxystrobin, Pyraclostrobin hoặc Chlorothalonil. Vệ sinh tàn dư cây bệnh và duy trì luống trồng khô ráo.",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "plant": "Cà chua",
        "disease": "Virus xoăn vàng lá (TYLCV)",
        "severity": "Nghiêm trọng",
        "recommendation": "Bệnh do bọ trĩ/bọ phấn trắng truyền: Phun thuốc diệt bọ phấn (Imidacloprid, Thiamethoxam). Nhổ bỏ tiêu hủy ngay cây nhiễm virus để tránh lây đàn.",
    },
    "Tomato___Tomato_mosaic_virus": {
        "plant": "Cà chua",
        "disease": "Virus khảm lá cà chua (ToMV)",
        "severity": "Nghiêm trọng",
        "recommendation": "Không có thuốc trị virus: Nhổ bỏ và tiêu hủy cây bệnh, khử trùng dụng cụ làm vườn bằng xà phòng/cồn để tránh lây qua tiếp xúc.",
    },
    "Tomato___healthy": {
        "plant": "Cà chua",
        "disease": "Cây khỏe mạnh",
        "severity": "Bình thường",
        "recommendation": "Cây cà chua phát triển xanh tốt, lá không có mầm bệnh. Duy trì tưới nhỏ giọt và cung cấp dinh dưỡng NPK cân đối.",
    },
}

def get_disease_info(raw_label: str) -> dict:
    """Tra cứu thông tin tiếng Việt từ nhãn gốc mô hình."""
    if raw_label in DISEASE_KNOWLEDGE:
        return DISEASE_KNOWLEDGE[raw_label]
    
    # Fallback nếu gặp nhãn lạ
    parts = raw_label.split("___")
    plant = parts[0].replace("_", " ").title() if len(parts) > 0 else "Chưa xác định"
    disease = parts[1].replace("_", " ").title() if len(parts) > 1 else raw_label
    return {
        "plant": plant,
        "disease": disease,
        "severity": "Chưa xác định",
        "recommendation": "Cần theo dõi thêm hoặc liên hệ chuyên gia nông nghiệp để được tư vấn chính xác.",
    }
