import json
import threading

import paho.mqtt.client as mqtt
from influxdb_client import Point
from influxdb_client.client.write_api import SYNCHRONOUS

from backend.database.influxdb import (
    client,
    INFLUX_BUCKET,
    INFLUX_ORG
)


MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_TOPICS = [
    "hydrolq/telemetry/node1",
    "hydrolq/telemetry/node2",
    "hydrolq/telemetry/node3",
    "hydrolq/telemetry/node4"
]


def on_connect(client_mqtt, userdata, flags, reason_code, properties):
    print("MQTT connected:", reason_code)

    for topic in MQTT_TOPICS:
     client_mqtt.subscribe(topic)
     print("Subscribed to:", topic)


def on_message(client_mqtt, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())

        print("\nMQTT data received:")
        print(payload)

        point = (
            Point("water_sensors")
            .tag(
                "device_id",
                payload.get("device_id", "unknown")
            )
            .tag(
                "zone",
                payload.get("zone", "UNKNOWN")
            )
            .tag(
                "stage",
                payload.get("stage", "UNKNOWN")
            )
            .field(
                "pressure",
                float(payload.get("pressure_bar", 0))
            )
            .field(
                "flow",
                float(payload.get("flow_L_min", 0))
            )
            .field(
                "acoustic",
                float(payload.get("acoustic_amp", 0))
            )
            .field(
                "ph",
                float(payload.get("pH", 0))
            )
            .field(
                "tds",
                float(payload.get("tds_ppm", 0))
            )
            .field(
                "turbidity",
                float(payload.get("turbidity_NTU", 0))
            )
        )

        write_api = client.write_api(
            write_options=SYNCHRONOUS
        )

        write_api.write(
            bucket=INFLUX_BUCKET,
            org=INFLUX_ORG,
            record=point
        )

        print("✓ MQTT data written to InfluxDB")

    except json.JSONDecodeError:
        print("✗ Invalid JSON received from MQTT")

    except Exception as e:
        print("✗ MQTT processing error:", e)


def start_mqtt():
    mqtt_client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2
    )

    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    print("Connecting to MQTT broker...")

    mqtt_client.connect(
        MQTT_BROKER,
        MQTT_PORT,
        60
    )

    mqtt_client.loop_forever()


def start_mqtt_background():
    mqtt_thread = threading.Thread(
        target=start_mqtt,
        daemon=True
    )

    mqtt_thread.start()

    print("MQTT background service started")