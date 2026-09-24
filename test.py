import os

from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT * FROM sensor_readings;")
        )

        for row in result:
            print(row)

    print("Ket noi PostgreSQL thanh cong!")

except Exception as e:
    print("Loi ket noi:")
    print(e)