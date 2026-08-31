<<<<<<< HEAD
=======
import os

import joblib
import pandas as pd

>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analytics import analyze_sensor_data
<<<<<<< HEAD

from backend.database.influxdb import (
    query_api,
    INFLUX_BUCKET,
    INFLUX_ORG,
)

from backend.mqtt_service import start_mqtt_background


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="HydroIQ Backend",
    description="Smart Water Network Monitoring and Analytics",
    version="1.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DEVICE -> ZONE MAPPING
# ============================================================

DEVICE_ZONE_MAP = {
    "ESP32_Node_1": "Zone_A",
    "ESP32_Node_2": "Zone_B",
    "ESP32_Node_3": "Zone_C",
    "ESP32_Node_4": "Zone_D",
}


# ============================================================
# ZONE INFORMATION
# ============================================================

ZONE_INFO = {
    "Zone_A": {
        "location_score": 15,
        "population": 1200,
        "critical_area": False,
    },

    "Zone_B": {
        "location_score": 10,
        "population": 900,
        "critical_area": False,
    },

    "Zone_C": {
        "location_score": 20,
        "population": 2300,
        "critical_area": True,
    },

    "Zone_D": {
        "location_score": 5,
        "population": 500,
        "critical_area": False,
    },
}


# ============================================================
# START MQTT
# ============================================================

@app.on_event("startup")
def startup_event():
    start_mqtt_background()
=======
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
>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134


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
<<<<<<< HEAD
        "status": "online",
=======
        "ml_model": "loaded"
>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134
    }


# ============================================================
<<<<<<< HEAD
=======
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
>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134
# LATEST SENSOR DATA
# ============================================================

@app.get("/sensors/latest")
def latest_sensors():

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
    '''

    tables = query_api.query(
        query,
<<<<<<< HEAD
        org=INFLUX_ORG,
    )

    latest_by_device = {}
=======
        org=INFLUX_ORG
    )
>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134

    for table in tables:

        for record in table.records:

            values = record.values

            device_id = values.get("device_id")

            # Ignore records without device ID
            if not device_id:
                continue

            # Ignore unknown devices
            if device_id not in DEVICE_ZONE_MAP:
                continue

            timestamp = values.get("_time")

            # Keep only newest reading
            if device_id in latest_by_device:

                old_timestamp = latest_by_device[
                    device_id
                ]["_time"]

                if (
                    timestamp is not None
                    and old_timestamp is not None
                    and timestamp <= old_timestamp
                ):
                    continue

            latest_by_device[device_id] = {

                "_time": timestamp,

                "device_id": device_id,

                "zone": DEVICE_ZONE_MAP[
                    device_id
                ],

                "stage": values.get("stage"),

                "pressure": values.get("pressure"),

                "flow": values.get("flow"),

                "acoustic": values.get("acoustic"),

                "ph": values.get("ph"),

                "tds": values.get("tds"),

                "turbidity": values.get("turbidity"),
            }

<<<<<<< HEAD

    # ========================================================
    # CONVERT TO LIST
    # ========================================================

    zones = []

    for record in latest_by_device.values():

        zones.append({

            "device_id": record["device_id"],

            "zone": record["zone"],

            "stage": record["stage"],

            "pressure": record["pressure"],

            "flow": record["flow"],

            "acoustic": record["acoustic"],

            "ph": record["ph"],

            "tds": record["tds"],

            "turbidity": record["turbidity"],

            "time": str(
                record["_time"]
            ),
        })


    # ========================================================
    # NO DATA
    # ========================================================

    if not zones:

        return {
            "message": "No sensor data found",
            "zones": [],
        }


    return {
        "zones": zones,
=======
    return {
        "message": "No sensor data found"
>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134
    }


# ============================================================
# SENSOR HISTORY
# ============================================================

@app.get("/sensors/history")
def sensor_history():

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
<<<<<<< HEAD
        org=INFLUX_ORG,
=======
        org=INFLUX_ORG
>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134
    )

    history = []

    for table in tables:

        for record in table.records:

            values = record.values

<<<<<<< HEAD
            device_id = values.get(
                "device_id"
            )

            # Ignore unknown devices
            if device_id not in DEVICE_ZONE_MAP:
                continue


            history.append({

                "time": str(
                    values.get("_time")
                ),

                "device_id": device_id,

                "zone": DEVICE_ZONE_MAP[
                    device_id
                ],

                "stage": values.get("stage"),

                "pressure": values.get("pressure"),

                "flow": values.get("flow"),

                "acoustic": values.get("acoustic"),

                "ph": values.get("ph"),

                "tds": values.get("tds"),

                "turbidity": values.get(
                    "turbidity"
                ),
            })

=======
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
>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134

    return {
        "data": history
    }


# ============================================================
# MANUAL ANALYTICS TEST
# ============================================================

# ============================================================
# ANALYZE SENSOR DATA
# ============================================================

@app.post("/analytics/analyze")
<<<<<<< HEAD
def analyze_data(
    data: SensorData
):

    # IMPORTANT:
    # analyze_sensor_data currently accepts
    # ONLY the sensor data dictionary.

    result = analyze_sensor_data(
        data.model_dump()
    )

=======
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

>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134
    return result


# ============================================================
<<<<<<< HEAD
# LATEST ANALYTICS - ALL ZONES
=======
# LATEST ANALYTICS + ML
>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134
# ============================================================

@app.get("/analytics/latest")
def latest_analytics():

<<<<<<< HEAD
    # ========================================================
    # GET LATEST SENSOR DATA
    # ========================================================

    sensor_result = latest_sensors()


    # ========================================================
    # NO DATA
    # ========================================================

    if not sensor_result.get("zones"):

        return {

            "zones": [],

            "priority_zones": [],

            "highest_priority": None,

            "network": {

                "risk_score": 0,

                "active_alerts": 0,

                "water_quality_index": 0,

                "monitored_zones": 0,
            },

            "message": "No sensor data found",
        }


    analyzed_zones = []


    # ========================================================
    # ANALYZE EACH ZONE
    # ========================================================

    for zone_data in sensor_result["zones"]:

        zone_name = zone_data.get(
            "zone"
        )


        # ----------------------------------------------------
        # GET LOCATION INFORMATION
        # ----------------------------------------------------

        location_info = ZONE_INFO.get(

            zone_name,

            {
                "location_score": 0,
                "population": 0,
                "critical_area": False,
            },
        )


        # ----------------------------------------------------
        # SENSOR DATA
        # ----------------------------------------------------

        sensor_data = {

            "pressure": zone_data.get(
                "pressure"
            ),

            "flow": zone_data.get(
                "flow"
            ),

            "acoustic": zone_data.get(
                "acoustic"
            ),

            "ph": zone_data.get(
                "ph"
            ),

            "tds": zone_data.get(
                "tds"
            ),

            "turbidity": zone_data.get(
                "turbidity"
            ),
        }


        # ----------------------------------------------------
        # HYDROIQ ANALYTICS
        # ----------------------------------------------------
        #
        # IMPORTANT:
        # Pass ONLY sensor_data.
        #
        # This fixes:
        #
        # TypeError:
        # analyze_sensor_data()
        # takes 1 positional argument
        # but 2 were given
        #
        # ----------------------------------------------------

        result = analyze_sensor_data(
            sensor_data
        )


        # ----------------------------------------------------
        # ADD ZONE INFORMATION
        # ----------------------------------------------------

        result["device_id"] = zone_data.get(
            "device_id"
        )

        result["zone"] = zone_name

        result["stage"] = zone_data.get(
            "stage"
        )

        result["location_score"] = (
            location_info["location_score"]
        )

        result["population"] = (
            location_info["population"]
        )

        result["critical_area"] = (
            location_info["critical_area"]
        )


        # ----------------------------------------------------
        # KEEP LOCATION SCORE IN PRIORITY DATA
        # ----------------------------------------------------

        if result.get("priority") is not None:

            result["priority"][
                "location_score"
            ] = location_info[
                "location_score"
            ]


        analyzed_zones.append(
            result
        )


    # ========================================================
    # SORT ALL ZONES BY RISK
    # ========================================================

    analyzed_zones.sort(

        key=lambda zone:
            zone.get(
                "risk",
                {}
            ).get(
                "score",
                0
            ),

        reverse=True,
    )


    # ========================================================
    # ONLY PROBLEMATIC ZONES
    # ========================================================

    priority_zones = [

        zone

        for zone in analyzed_zones

        if zone.get(
            "priority"
        ) is not None
    ]


    # ========================================================
    # PRIORITY ORDER
    # ========================================================

    priority_order = {

        "P1": 1,

        "P2": 2,

        "P3": 3,

        "P4": 4,

        "P5": 5,
    }


    priority_zones.sort(
=======
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
>>>>>>> 1847f5a0e9e4a0331ab862eca60940ddd5f1f134

        key=lambda zone: (

            priority_order.get(

                zone.get(
                    "priority",
                    {}
                ).get(
                    "priority",
                    "P5"
                ),

                5,
            ),

            -zone.get(
                "priority",
                {}
            ).get(
                "score",
                0
            ),
        )
    )


    # ========================================================
    # HIGHEST PRIORITY
    # ========================================================

    highest_priority = None

    if priority_zones:

        highest_priority = (
            priority_zones[0]
        )


    # ========================================================
    # NETWORK RISK
    # ========================================================

    network_risk = 0


    for zone in analyzed_zones:

        risk_score = zone.get(
            "risk",
            {}
        ).get(
            "score",
            0
        )

        if risk_score > network_risk:

            network_risk = risk_score


    # Priority score can also contribute
    for zone in priority_zones:

        priority_score = zone.get(
            "priority",
            {}
        ).get(
            "score",
            0
        )

        if priority_score > network_risk:

            network_risk = priority_score


    network_risk = min(
        network_risk,
        100
    )


    # ========================================================
    # ACTIVE ALERTS
    # ========================================================

    active_alerts = len(
        priority_zones
    )


    # ========================================================
    # WATER QUALITY INDEX
    # ========================================================

    quality_scores = []


    for zone in analyzed_zones:

        quality = zone.get(
            "water_quality",
            {}
        )

        status = quality.get(
            "status"
        )


        if status == "Good":

            quality_scores.append(
                100
            )

        elif status == "Fair":

            quality_scores.append(
                70
            )

        elif status == "Poor":

            quality_scores.append(
                40
            )

        else:

            quality_scores.append(
                0
            )


    if quality_scores:

        water_quality_index = round(

            sum(
                quality_scores
            )
            /
            len(
                quality_scores
            )
        )

    else:

        water_quality_index = 0


    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "zones": analyzed_zones,

        "priority_zones": priority_zones,

        "highest_priority": (

            {

                "zone":
                    highest_priority.get(
                        "zone"
                    ),

                "priority":
                    highest_priority.get(
                        "priority"
                    ),

                "condition":
                    highest_priority.get(
                        "condition"
                    ),

                "risk":
                    highest_priority.get(
                        "risk"
                    ),

                "population":
                    highest_priority.get(
                        "population"
                    ),
            }

            if highest_priority

            else None
        ),

        "network": {

            "risk_score":
                network_risk,

            "active_alerts":
                active_alerts,

            "water_quality_index":
                water_quality_index,

            "monitored_zones":
                len(analyzed_zones),
        },
    }