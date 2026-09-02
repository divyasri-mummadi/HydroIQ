import json
import time
import paho.mqtt.client as mqtt

BROKER = "broker.emqx.io"
PORT = 1883
TOPIC = "hydrolq/telemetry/node1"


zones = [
    {
        "device_id": "ESP32_Node_1",
        "stage": "NORMAL",
        "pressure_bar": 3.0,
        "flow_L_min": 120,
        "acoustic_amp": 0.30,
        "pH": 7.2,
        "tds_ppm": 300,
        "turbidity_NTU": 1.5
    },
    {
        "device_id": "ESP32_Node_2",
        "stage": "EARLY_ANOMALY",
        "pressure_bar": 2.35,
        "flow_L_min": 132,
        "acoustic_amp": 0.65,
        "pH": 7.2,
        "tds_ppm": 330,
        "turbidity_NTU": 3.5
    },
    {
        "device_id": "ESP32_Node_3",
        "stage": "LEAK",
        "pressure_bar": 1.7,
        "flow_L_min": 165,
        "acoustic_amp": 1.8,
        "pH": 7.1,
        "tds_ppm": 300,
        "turbidity_NTU": 2.0
    },
    {
        "device_id": "ESP32_Node_4",
        "stage": "WATER_QUALITY",
        "pressure_bar": 3.0,
        "flow_L_min": 118,
        "acoustic_amp": 0.30,
        "pH": 5.8,
        "tds_ppm": 650,
        "turbidity_NTU": 6.0
    }
]


client = mqtt.Client()

print("Connecting to MQTT broker...")

client.connect(
    BROKER,
    PORT,
    60
)

print("Connected!")
print("Starting 4-zone simulation...\n")


while True:

    for zone in zones:

        payload = json.dumps(zone)

        client.publish(
            TOPIC,
            payload
        )

        print(
            f"Published {zone['device_id']} "
            f"→ {zone['stage']}"
        )

        time.sleep(0.5)

    print("\nAll 4 zones published.\n")

    time.sleep(2)
    