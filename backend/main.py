from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class SensorData(BaseModel):
    device_id: str
    zone: str
    pressure: float
    flow: float
    acoustic: float
    ph: float
    tds: float
    turbidity: float


@app.get("/")
def home():
    return {"message": "HydroIQ Backend Running"}


@app.get("/sensors/latest")
def latest_sensors():
    return {
        "device_id": "ESP32_01",
        "zone": "Zone_A",
        "pressure": 2.6,
        "flow": 118,
        "acoustic": 0.82,
        "ph": 7.2,
        "tds": 312,
        "turbidity": 4.8
    }


@app.post("/sensors")
def receive_sensor_data(data: SensorData):
    return {
        "message": "Sensor data received",
        "data": data
    }