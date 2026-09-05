from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import time
from threading import Lock

from analytics import analyze_sensor_data

from backend.database.influxdb import (
    query_api,
    INFLUX_BUCKET,
    INFLUX_ORG
)

from backend.mqtt_service import start_mqtt_background


app = FastAPI(
    title="HydroIQ Backend",
    description="Smart Water Network Monitoring and Analytics",
    version="1.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.on_event("startup")
def startup_event():
    start_mqtt_background()


class SensorData(BaseModel):
    pressure: float
    flow: float
    acoustic: float
    ph: float
    tds: float
    turbidity: float


DEVICE_ZONE_MAP = {
    "ESP32_Node_1": "Zone_A",
    "ESP32_Node_2": "Zone_B",
    "ESP32_Node_3": "Zone_C",
    "ESP32_Node_4": "Zone_D"
}


ZONE_INFO = {
    "Zone_A": {
        "location_score": 15,
        "population": 1200,
        "critical_area": False,
        "facilities": []
    },

    "Zone_B": {
        "location_score": 10,
        "population": 900,
        "critical_area": False,
        "facilities": []
    },

    "Zone_C": {
        "location_score": 20,
        "population": 2300,
        "critical_area": True,
        "facilities": []
    },

    "Zone_D": {
        "location_score": 5,
        "population": 500,
        "critical_area": False,
        "facilities": []
    }
}


@app.get("/")
def home():
    return {
        "message": "HydroIQ Backend Running",
        "status": "online"
    }


# ============================================================
# INFLUXDB CACHE / RATE-LIMIT PROTECTION
# ============================================================
# Wokwi publishes telemetry every 2 seconds. Multiple frontend
# screens can request the same endpoint at nearly the same time.
# These short caches prevent every browser request from becoming
# a separate InfluxDB Cloud query.

LATEST_CACHE_TTL = 2.0       # seconds - matches Wokwi publish rate
HISTORY_CACHE_TTL = 15.0     # seconds - history does not need 2s refresh

_latest_cache = None
_latest_cache_time = 0.0
_history_cache = None
_history_cache_time = 0.0

_latest_cache_lock = Lock()
_history_cache_lock = Lock()


def _query_latest_sensors_uncached():

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
        org=INFLUX_ORG
    )

    latest_by_device = {}

    for table in tables:
        for record in table.records:
            values = record.values
            device_id = values.get("device_id")

            if not device_id or device_id not in DEVICE_ZONE_MAP:
                continue

            timestamp = values.get("_time")

            if device_id in latest_by_device:
                existing_time = latest_by_device[device_id].get("_time")
                if (
                    existing_time is not None
                    and timestamp is not None
                    and timestamp <= existing_time
                ):
                    continue

            latest_by_device[device_id] = {
                "_time": timestamp,
                "device_id": device_id,
                "zone": DEVICE_ZONE_MAP[device_id],
                "stage": values.get("stage"),
                "pressure": values.get("pressure"),
                "flow": values.get("flow"),
                "acoustic": values.get("acoustic"),
                "ph": values.get("ph"),
                "tds": values.get("tds"),
                "turbidity": values.get("turbidity")
            }

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
            "time": str(record["_time"])
        })

    zones.sort(key=lambda zone: zone["zone"])
    return {"zones": zones}


@app.get("/sensors/latest")
def latest_sensors():
    global _latest_cache, _latest_cache_time

    now = time.monotonic()
    if (
        _latest_cache is not None
        and (now - _latest_cache_time) < LATEST_CACHE_TTL
    ):
        return _latest_cache

    # Prevent simultaneous frontend requests from all hitting InfluxDB.
    with _latest_cache_lock:
        now = time.monotonic()
        if (
            _latest_cache is not None
            and (now - _latest_cache_time) < LATEST_CACHE_TTL
        ):
            return _latest_cache

        try:
            result = _query_latest_sensors_uncached()
            _latest_cache = result
            _latest_cache_time = time.monotonic()
            return result
        except Exception:
            # Keep the dashboard usable during a temporary InfluxDB 429.
            if _latest_cache is not None:
                return _latest_cache
            raise


def _query_history_uncached():

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
            device_id = values.get("device_id")

            if device_id not in DEVICE_ZONE_MAP:
                continue

            history.append({
                "time": str(values.get("_time")),
                "device_id": device_id,
                "zone": DEVICE_ZONE_MAP[device_id],
                "stage": values.get("stage"),
                "pressure": values.get("pressure"),
                "flow": values.get("flow"),
                "acoustic": values.get("acoustic"),
                "ph": values.get("ph"),
                "tds": values.get("tds"),
                "turbidity": values.get("turbidity")
            })

    return {"data": history}


@app.get("/sensors/history")
def sensor_history():
    global _history_cache, _history_cache_time

    now = time.monotonic()
    if (
        _history_cache is not None
        and (now - _history_cache_time) < HISTORY_CACHE_TTL
    ):
        return _history_cache

    with _history_cache_lock:
        now = time.monotonic()
        if (
            _history_cache is not None
            and (now - _history_cache_time) < HISTORY_CACHE_TTL
        ):
            return _history_cache

        try:
            result = _query_history_uncached()
            _history_cache = result
            _history_cache_time = time.monotonic()
            return result
        except Exception:
            if _history_cache is not None:
                return _history_cache
            raise


@app.post("/analytics/analyze")
def analyze_data(data: SensorData):

    sensor_data = data.model_dump()

    result = analyze_sensor_data(
        sensor_data
    )

    return result


@app.get("/analytics/latest")
def latest_analytics():

    sensor_result = latest_sensors()

    zones = sensor_result.get(
        "zones",
        []
    )

    if not zones:

        return {
            "zones": [],
            "priority_zones": [],
            "highest_priority": None,
            "network": {
                "risk_score": 0,
                "active_alerts": 0,
                "water_quality_index": 0,
                "monitored_zones": 0
            }
        }

    analyzed_zones = []

    for zone_data in zones:

        zone_name = zone_data.get(
            "zone"
        )

        location_info = ZONE_INFO.get(
            zone_name,
            {
                "location_score": 0,
                "population": 0,
                "critical_area": False,
                "facilities": []
            }
        )

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
            )
        }

        result = analyze_sensor_data(
            sensor_data,

            location_score=location_info[
                "location_score"
            ],

            population=location_info[
                "population"
            ],

            facilities=location_info.get(
                "facilities",
                []
            ),

            critical_area=location_info[
                "critical_area"
            ],

            trend_score=0
        )

        result["device_id"] = zone_data.get(
            "device_id"
        )

        result["zone"] = zone_name

        result["stage"] = zone_data.get(
            "stage"
        )

        result["location_score"] = (
            location_info[
                "location_score"
            ]
        )

        result["population"] = (
            location_info[
                "population"
            ]
        )

        result["critical_area"] = (
            location_info[
                "critical_area"
            ]
        )

        result["facilities"] = (
            location_info.get(
                "facilities",
                []
            )
        )

        analyzed_zones.append(
            result
        )

    priority_zones = [
        zone
        for zone in analyzed_zones
        if zone.get("priority") is not None
    ]

    priority_zones.sort(
        key=lambda zone: zone.get(
            "priority",
            {}
        ).get(
            "score",
            0
        ),
        reverse=True
    )

    for index, zone in enumerate(
        priority_zones
    ):

        priority = zone.get(
            "priority"
        )

        if priority is not None:

            priority["priority"] = (
                f"P{index + 1}"
            )

    highest_priority = (
        priority_zones[0]
        if priority_zones
        else None
    )

    risk_scores = []

    for zone in analyzed_zones:

        risk_score = zone.get(
            "risk",
            {}
        ).get(
            "score",
            0
        )

        risk_scores.append(
            float(risk_score or 0)
        )

    network_risk = (
        max(risk_scores)
        if risk_scores
        else 0
    )

    quality_scores = []

    for zone in analyzed_zones:

        status = zone.get(
            "water_quality",
            {}
        ).get(
            "status",
            "Good"
        )

        if status == "Good":
            quality_scores.append(100)

        elif status == "Fair":
            quality_scores.append(70)

        elif status == "Moderate":
            quality_scores.append(55)

        elif status == "Poor":
            quality_scores.append(40)

        else:
            quality_scores.append(0)

    water_quality_index = (
        round(
            sum(quality_scores)
            / len(quality_scores)
        )
        if quality_scores
        else 0
    )

    return {
        "zones": analyzed_zones,

        "priority_zones": priority_zones,

        "highest_priority": (
            {
                "zone": highest_priority.get(
                    "zone"
                ),
                "priority": highest_priority.get(
                    "priority"
                ),
                "condition": highest_priority.get(
                    "condition"
                ),
                "risk": highest_priority.get(
                    "risk"
                ),
                "population": highest_priority.get(
                    "population"
                )
            }
            if highest_priority
            else None
        ),

        "network": {
            "risk_score": round(
                network_risk
            ),
            "active_alerts": len(
                priority_zones
            ),
            "water_quality_index": (
                water_quality_index
            ),
            "monitored_zones": len(
                analyzed_zones
            )
        }
    }


# ============================================================
# LOCAL HYDROIQ AI CHAT
# ============================================================
# This endpoint intentionally does NOT require Gemini or any
# external API key. It answers from the same live analytics
# already used by the dashboard.

class AIRequest(BaseModel):
    message: str
    context: dict = {}


@app.post("/ai/chat")
def ai_chat(request: AIRequest):

    message = request.message.strip().lower()

    try:
        analytics = latest_analytics()
        zones = analytics.get("zones", [])
    except Exception:
        zones = []

    leaks = [
        zone for zone in zones
        if zone.get("stage") == "LEAK"
        or zone.get("condition", {}).get("condition") == "LEAK"
        or zone.get("leak", {}).get("leak_detected") is True
    ]

    quality = [
        zone for zone in zones
        if zone.get("stage") == "WATER_QUALITY"
        or zone.get("condition", {}).get("condition") == "WATER_QUALITY"
    ]

    faults = [
        zone for zone in zones
        if zone.get("stage") == "SENSOR_FAULT"
        or zone.get("condition", {}).get("condition") == "SENSOR_FAULT"
    ]

    anomalies = [
        zone for zone in zones
        if zone.get("stage") == "EARLY_ANOMALY"
        or zone.get("condition", {}).get("condition") == "EARLY_ANOMALY"
    ]

    # Highest-risk zone
    highest = None
    if zones:
        highest = max(
            zones,
            key=lambda z: float(
                z.get("risk", {}).get("score", 0) or 0
            )
        )

    # --------------------------------------------------------
    # Question-specific answers
    # --------------------------------------------------------

    if "what is a leak" in message or (
        "what" in message and "leak" in message
    ):
        response = (
            "A pipeline leak is an abnormal loss of water from the "
            "network. HydroIQ detects it by combining pressure drop, "
            "flow increase and acoustic evidence. A strong leak signal "
            "should trigger immediate inspection and, where required, "
            "isolation of the affected zone."
        )

    elif "highest risk" in message or "most risky" in message:
        if highest:
            zone_name = highest.get("zone", "Unknown")
            score = highest.get("risk", {}).get("score", 0)
            stage = highest.get("stage", "NORMAL")
            response = (
                f"{zone_name} currently has the highest network risk "
                f"with a WRS of {score}/100. Current condition: "
                f"{stage}. "
            )

            if leaks and highest.get("zone") == leaks[0].get("zone"):
                response += (
                    "The main concern is a detected leak, so immediate "
                    "inspection and isolation is recommended."
                )
            elif quality and highest.get("zone") == quality[0].get("zone"):
                response += (
                    "The main concern is water quality; verify the "
                    "readings and inspect the affected zone."
                )
            else:
                response += (
                    "Prioritize inspection of this zone before lower-risk "
                    "areas."
                )
        else:
            response = "Live network risk data is currently unavailable."

    elif (
        "leak" in message
        or "leaks" in message
        or "leak situation" in message
    ):
        if leaks:
            zone = leaks[0]
            response = (
                f"{zone.get('zone', 'Unknown')} currently shows a "
                f"pipeline leak. Pressure is "
                f"{zone.get('pressure', '--')} bar, flow is "
                f"{zone.get('flow', '--')} L/min and acoustic amplitude "
                f"is {zone.get('acoustic', '--')}. Immediate inspection "
                f"and isolation is recommended."
            )
        else:
            response = (
                "No active pipeline leak is currently detected across "
                "the monitored zones."
            )

    elif (
        "water quality" in message
        or "quality issue" in message
        or "quality concern" in message
        or "water-quality" in message
    ):
        if quality:
            zone = quality[0]
            response = (
                f"{zone.get('zone', 'Unknown')} currently shows a "
                f"water-quality concern. pH is {zone.get('ph', '--')}, "
                f"TDS is {zone.get('tds', '--')} ppm and turbidity is "
                f"{zone.get('turbidity', '--')} NTU. Verify the readings "
                f"and inspect the zone."
            )
        else:
            response = (
                "No active water-quality concern is currently detected "
                "across the monitored zones."
            )

    elif (
        "sensor health" in message
        or "unhealthy sensor" in message
        or "sensor fault" in message
        or "suspicious sensor" in message
    ):
        if faults:
            names = ", ".join(
                zone.get("zone", "Unknown")
                for zone in faults
            )
            response = (
                f"Sensor fault detected in {names}. Inspect or "
                f"recalibrate the affected sensor and validate its "
                f"readings against nearby nodes."
            )
        else:
            response = (
                "No active sensor fault is currently reported by the "
                "HydroIQ analytics engine."
            )

    elif (
        "anomaly" in message
        or "early warning" in message
        or "early anomaly" in message
    ):
        if anomalies:
            names = ", ".join(
                zone.get("zone", "Unknown")
                for zone in anomalies
            )
            response = (
                f"{names} currently show an early network anomaly. "
                f"Preventive inspection is recommended before the "
                f"condition develops further."
            )
        else:
            response = (
                "No early network anomaly is currently detected."
            )

    elif (
        "briefing" in message
        or "operational" in message
        or "network status" in message
        or "current status" in message
    ):
        risk = analytics.get("network", {}).get("risk_score", 0)
        alert_count = analytics.get("network", {}).get("active_alerts", 0)
        zone_count = analytics.get("network", {}).get("monitored_zones", len(zones))

        response = (
            f"HydroIQ is currently monitoring {zone_count} zones. "
            f"Network risk is {risk}/100 with {alert_count} active "
            f"alert(s). "
        )

        if leaks:
            response += f"Leak concern: {leaks[0].get('zone')}. "
        if quality:
            response += f"Water-quality concern: {quality[0].get('zone')}. "
        if faults:
            response += f"Sensor fault: {faults[0].get('zone')}. "
        if anomalies:
            response += f"Early anomaly: {anomalies[0].get('zone')}. "

        if not leaks and not quality and not faults and not anomalies:
            response += "All monitored zones are currently operating normally."

    else:
        response = (
            "I can analyze the live HydroIQ network. Try asking: "
            "\"Which zone has the highest risk?\", "
            "\"Explain the current leak situation\", "
            "\"Are there any water quality concerns?\", or "
            "\"Give me an operational briefing.\""
        )

    return {
        "response": response,
        "status": "ok",
        "source": "HydroIQ local analytics"
    }


alerts = []


@app.post("/api/alerts")
def create_alert(alert: dict):

    alerts.append(
        alert
    )

    return {
        "success": True,
        "message": "Alert received",
        "alert": alert
    }


@app.get("/api/alerts")
def get_alerts():

    return {
        "alerts": alerts
    }