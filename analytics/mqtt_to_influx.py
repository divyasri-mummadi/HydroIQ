import os
import json

import paho.mqtt.client as mqtt

from dotenv import load_dotenv
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS


# ==============================
# LOAD .ENV
# ==============================

load_dotenv()

INFLUX_URL = os.getenv("INFLUX_URL")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = os.getenv("INFLUX_ORG")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET")


# ==============================
# MQTT SETTINGS
# ==============================

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_TOPIC = "hydrolq/telemetry/node1"


# ==============================
# INFLUXDB CONNECTION
# ==============================

influx_client = InfluxDBClient(
    url=INFLUX_URL,
    token=INFLUX_TOKEN,
    org=INFLUX_ORG
)

write_api = influx_client.write_api(
    write_options=SYNCHRONOUS
)


# ==============================
# WHEN MQTT CONNECTS
# ==============================

def on_connect(client, userdata, flags, reason_code, properties=None):

    print("Connected to MQTT!")
    print("Subscribing to:", MQTT_TOPIC)

    client.subscribe(MQTT_TOPIC)

    print("Waiting for sensor data...")


# ==============================
# WHEN SENSOR DATA ARRIVES
# ==============================

def on_message(client, userdata, message):

    try:

        data = json.loads(
            message.payload.decode("utf-8")
        )

        device_id = data.get(
            "device_id",
            "unknown"
        )

        stage = data.get(
            "stage",
            "UNKNOWN"
        )

        pressure = data.get("pressure_bar")
        flow = data.get("flow_L_min")
        acoustic = data.get("acoustic_amp")
        ph = data.get("pH")
        tds = data.get("tds_ppm")
        turbidity = data.get("turbidity_NTU")


        # ==============================
        # CREATE INFLUXDB DATA POINT
        # ==============================

        point = (
            Point("water_sensors")
            .tag("device_id", device_id)
            .tag("zone", "Zone-1")
            .tag("stage", stage)

            .field("pressure", float(pressure))
            .field("flow", float(flow))
            .field("acoustic", float(acoustic))
            .field("ph", float(ph))
            .field("tds", float(tds))
            .field("turbidity", float(turbidity))
        )


        # ==============================
        # SAVE TO INFLUXDB
        # ==============================

        write_api.write(
            bucket=INFLUX_BUCKET,
            org=INFLUX_ORG,
            record=point
        )


        print(
            f"Saved to InfluxDB: "
            f"{stage} | "
            f"P={pressure} | "
            f"Flow={flow} | "
            f"Acoustic={acoustic}"
        )


    except Exception as e:

        print("Error:", e)


# ==============================
# MQTT CLIENT
# ==============================

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id="HydroIQ_InfluxDB_Bridge"
)

client.on_connect = on_connect
client.on_message = on_message


# ==============================
# START
# ==============================

print("Starting MQTT → InfluxDB...")

client.connect(
    MQTT_BROKER,
    MQTT_PORT,
    60
)

client.loop_forever()