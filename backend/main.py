import os

import joblib
import pandas as pd

from fastapi import FastAPI
from pydantic import BaseModel

from analytics import analyze_sensor_data
from analytics.sensor_health import calculate_sensor_health
from analytics.filters import filter_sensor_data
from analytics.prioritization import calculate_priority
from dotenv import load_dotenv

from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

INFLUX_URL = os.getenv("INFLUX_URL")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = os.getenv("INFLUX_ORG")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET")


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="HydroIQ Backend",
    description="Water network intelligence and ML analytics system",
    version="1.0"
)


# ============================================================
# INFLUXDB CONNECTION
# ============================================================

client = InfluxDBClient(
    url=INFLUX_URL,
    token=INFLUX_TOKEN,
    org=INFLUX_ORG
)

write_api = client.write_api(
    write_options=SYNCHRONOUS
)


# ============================================================
# LOAD TRAINED ML MODEL
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_FILE = os.path.join(
    BASE_DIR,
    "hydroiq_ml_model.pkl"
)

ml_model = joblib.load(MODEL_FILE)

print("HydroIQ ML model loaded successfully!")


# ============================================================
# SENSOR DATA MODEL
# ============================================================

class SensorData(BaseModel):
    pressure: float
    flow: float
    acoustic: float
    ph: float
    tds: float
    turbidity: float


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "HydroIQ Backend Running",
        "ml_model": "loaded"
    }


# ============================================================
# ML PREDICTION FUNCTION
# ============================================================

def predict_ml(sensor_data):
    """
    Run the trained HydroIQ ML model on sensor readings.
    """

    # IMPORTANT:
    # These names must match the names used while training
    ml_input = pd.DataFrame(
        [
            {
                "pressure": sensor_data["pressure"],
                "flow": sensor_data["flow"],
                "acoustic": sensor_data["acoustic"],
                "pH": sensor_data["ph"],
                "tds": sensor_data["tds"],
                "turbidity": sensor_data["turbidity"]
            }
        ]
    )

    # Prediction
    prediction = ml_model.predict(ml_input)[0]

    # Probability / confidence
    probabilities = ml_model.predict_proba(ml_input)[0]

    confidence = float(max(probabilities))

    # Store probability of every class
    class_probabilities = {}

    for class_name, probability in zip(
        ml_model.classes_,
        probabilities
    ):
        class_probabilities[class_name] = round(
            float(probability),
            4
        )

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4),
        "class_probabilities": class_probabilities
    }


# ============================================================
# LATEST SENSOR DATA
# ============================================================

@app.get("/sensors/latest")
def latest_sensors():

    query_api = client.query_api()

    query = f'''
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "water_sensors")
      |> pivot(
          rowKey: ["_time"],
          columnKey: ["_field"],
          valueColumn: "_value"
      )
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)
    '''

    tables = query_api.query(
        query,
        org=INFLUX_ORG
    )

    for table in tables:

        for record in table.records:

            values = record.values

            return {
                "device_id": values.get("device_id"),
                "zone": values.get("zone"),
                "pressure": values.get("pressure"),
                "flow": values.get("flow"),
                "acoustic": values.get("acoustic"),
                "ph": values.get("ph"),
                "tds": values.get("tds"),
                "turbidity": values.get("turbidity")
            }

    return {
        "message": "No sensor data found"
    }


# ============================================================
# SENSOR HISTORY
# ============================================================

@app.get("/sensors/history")
def sensor_history():

    query_api = client.query_api()

    query = f'''
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -7d)
      |> filter(fn: (r) => r["_measurement"] == "water_sensors")
      |> pivot(
          rowKey: ["_time"],
          columnKey: ["_field"],
          valueColumn: "_value"
      )
      |> sort(columns: ["_time"])
    '''

    tables = query_api.query(
        query,
        org=INFLUX_ORG
    )

    history = []

    for table in tables:

        for record in table.records:

            values = record.values

            history.append(
                {
                    "time": str(values.get("_time")),
                    "device_id": values.get("device_id"),
                    "zone": values.get("zone"),
                    "pressure": values.get("pressure"),
                    "flow": values.get("flow"),
                    "acoustic": values.get("acoustic"),
                    "ph": values.get("ph"),
                    "tds": values.get("tds"),
                    "turbidity": values.get("turbidity")
                }
            )

    return {
        "data": history
    }


# ============================================================
# ANALYZE SENSOR DATA
# ============================================================

@app.post("/analytics/analyze")
def analyze_data(data: SensorData):

    # Convert Pydantic model to dictionary
    sensor_data = data.model_dump()

    # --------------------------------------------------------
    # 1. KALMAN FILTER
    # --------------------------------------------------------

    filtered_data = filter_sensor_data(
        sensor_data
    )

    # --------------------------------------------------------
    # 2. EXISTING HYDROIQ ANALYTICS
    # --------------------------------------------------------

    result = analyze_sensor_data(
        filtered_data
    )

    # --------------------------------------------------------
    # 3. SENSOR HEALTH
    # --------------------------------------------------------

    sensor_health = calculate_sensor_health(
        filtered_data
    )

    result["sensor_health"] = sensor_health

    # --------------------------------------------------------
    # 4. MACHINE LEARNING
    # --------------------------------------------------------

    ml_result = predict_ml(
        filtered_data
    )

    result["ml_prediction"] = ml_result
    priority = calculate_priority(
    result,
    ml_result,
    sensor_health
)

    result["priority"] = priority

    # --------------------------------------------------------
    # 5. RETURN COMPLETE RESULT
    # --------------------------------------------------------

    return result


# ============================================================
# LATEST ANALYTICS + ML
# ============================================================

@app.get("/analytics/latest")
def latest_analytics():

    # --------------------------------------------------------
    # 1. GET LATEST SENSOR READING
    # --------------------------------------------------------

    sensor_result = latest_sensors()

    if "message" in sensor_result:
        return sensor_result


    # --------------------------------------------------------
    # 2. EXTRACT SENSOR DATA
    # --------------------------------------------------------

    sensor_data = {
        "pressure": sensor_result.get("pressure"),
        "flow": sensor_result.get("flow"),
        "acoustic": sensor_result.get("acoustic"),
        "ph": sensor_result.get("ph"),
        "tds": sensor_result.get("tds"),
        "turbidity": sensor_result.get("turbidity")
    }


    # --------------------------------------------------------
    # 3. KALMAN FILTER
    # --------------------------------------------------------

    filtered_data = filter_sensor_data(
        sensor_data
    )


    # --------------------------------------------------------
    # 4. EXISTING ANALYTICS
    # --------------------------------------------------------

    result = analyze_sensor_data(
        filtered_data
    )


    # --------------------------------------------------------
    # 5. SENSOR HEALTH
    # --------------------------------------------------------

    sensor_health = calculate_sensor_health(
        filtered_data
    )

    result["sensor_health"] = sensor_health


    # --------------------------------------------------------
    # 6. MACHINE LEARNING
    # --------------------------------------------------------

    ml_result = predict_ml(
        filtered_data
    )

    result["ml_prediction"] = ml_result


    # --------------------------------------------------------
    # 7. PRIORITIZATION
    # --------------------------------------------------------

    priority = calculate_priority(
        result,
        ml_result,
        sensor_health
    )

    result["priority"] = priority


    # --------------------------------------------------------
    # 8. DEVICE INFORMATION
    # --------------------------------------------------------

    result["device_id"] = sensor_result.get(
        "device_id"
    )

    result["zone"] = sensor_result.get(
        "zone"
    )


    # --------------------------------------------------------
    # 9. RETURN FINAL RESULT
    # --------------------------------------------------------

    return result