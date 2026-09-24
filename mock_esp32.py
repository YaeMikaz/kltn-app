# mock_esp32.py
import requests
import random
import time

URL = "http://localhost:8000/sensor-data"

print("Bat dau gia lap ESP32... (Ctrl+C de dung)")

while True:
    data = {
        "ec":          round(random.uniform(0.8, 2.5), 2),
        "moisture":    round(random.uniform(40, 85), 1),
        "temperature": round(random.uniform(25, 35), 1),
        "n_estimate":  round(random.uniform(80, 180), 1)
    }

    response = requests.post(URL, json=data)

    if response.status_code == 200:
        print(f"Gui thanh cong: {data}")
    else:
        print(f"Loi: {response.status_code}")

    time.sleep(5)