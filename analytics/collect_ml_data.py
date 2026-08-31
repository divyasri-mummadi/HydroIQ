import csv
import json
import os
from datetime import datetime, timezone

import paho.mqtt.client as mqtt


# =========================
# MQTT SETTINGS
# =========================

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_TOPIC = "hydrolq/telemetry/node1"


# =========================
# DATASET LOCATION
# =========================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_FILE = os.path.join(BASE_DIR, "ml_dataset.csv")


# =========================
# CSV COLUMNS
# =========================

FIELDS = [
    "timestamp",
    "device_id",
    "stage",
    "pressure",
    "flow",
    "acoustic",
    "pH",
    "tds",
    "turbidity",
]


# =========================
# CREATE CSV IF NEEDED
# =========================

if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()


# =========================
# MQTT CONNECTED
# =========================

def on_connect(client, userdata, flags, reason_code, properties=None):
    print("Connected to MQTT broker!")
    print(f"Subscribing to: {MQTT_TOPIC}")

    client.subscribe(MQTT_TOPIC)

    print("Waiting for sensor data...")
    print(f"Saving dataset to: {CSV_FILE}")


# =========================
# NEW MQTT MESSAGE
# =========================

def on_message(client, userdata, message):

    try:
        # Convert MQTT message to Python dictionary
        data = json.loads(message.payload.decode("utf-8"))

        # Get values from the Wokwi JSON
        row = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "device_id": data.get("device_id"),
            "stage": data.get("stage"),

            "pressure": data.get("pressure_bar"),
            "flow": data.get("flow_L_min"),
            "acoustic": data.get("acoustic_amp"),
            "pH": data.get("pH"),
            "tds": data.get("tds_ppm"),
            "turbidity": data.get("turbidity_NTU"),
        }

        # Make sure the stage is one of our ML classes
        valid_stages = {
            "NORMAL",
            "EARLY_ANOMALY",
            "LEAK",
            "SENSOR_FAULT",
        }

        if row["stage"] not in valid_stages:
            print(f"Ignoring unknown stage: {row['stage']}")
            return

        # Save row to CSV
        with open(CSV_FILE, "a", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=FIELDS)
            writer.writerow(row)

        # Show what was saved
        print(
            f"Saved: {row['stage']} | "
            f"P={row['pressure']} | "
            f"Flow={row['flow']} | "
            f"Acoustic={row['acoustic']}"
        )

    except json.JSONDecodeError:
        print("Received invalid JSON")

    except Exception as e:
        print(f"Error processing message: {e}")


# =========================
# CREATE MQTT CLIENT
# =========================

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id="HydroIQ_ML_DataCollector"
)

client.on_connect = on_connect
client.on_message = on_message


# =========================
# CONNECT
# =========================

print("Connecting to MQTT broker...")

client.connect(
    MQTT_BROKER,
    MQTT_PORT,
    60
)


# =========================
# START LISTENING
# =========================

client.loop_forever()