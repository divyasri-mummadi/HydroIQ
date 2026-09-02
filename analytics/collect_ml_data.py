import csv
import json
import os
from datetime import datetime, timezone

import paho.mqtt.client as mqtt


# ============================================================
# MQTT SETTINGS
# ============================================================

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883

# Listen to all HydroIQ telemetry nodes
MQTT_TOPIC = "hydrolq/telemetry/#"


# ============================================================
# DATASET LOCATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

CSV_FILE = os.path.join(
    BASE_DIR,
    "ml_dataset.csv"
)


# ============================================================
# CSV COLUMNS
# ============================================================

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


# ============================================================
# VALID ML CLASSES
# ============================================================

VALID_STAGES = {
    "NORMAL",
    "EARLY_ANOMALY",
    "LEAK",
    "SENSOR_FAULT",
    "WATER_QUALITY",
}


# ============================================================
# CREATE CSV IF NEEDED
# ============================================================

if not os.path.exists(CSV_FILE):

    with open(
        CSV_FILE,
        "w",
        newline="",
        encoding="utf-8",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=FIELDS,
        )

        writer.writeheader()


# ============================================================
# MQTT CONNECTED
# ============================================================

def on_connect(
    client,
    userdata,
    flags,
    reason_code,
    properties=None,
):

    print()
    print("=" * 60)
    print("HYDROIQ ML DATA COLLECTOR")
    print("=" * 60)

    print(
        f"Connected to MQTT broker: "
        f"{MQTT_BROKER}:{MQTT_PORT}"
    )

    print(
        f"Subscribing to: {MQTT_TOPIC}"
    )

    client.subscribe(MQTT_TOPIC)

    print()
    print("Collecting Wokwi telemetry...")
    print(
        f"Dataset: {CSV_FILE}"
    )

    print()
    print("Accepted stages:")

    for stage in sorted(VALID_STAGES):
        print(f"  - {stage}")

    print()
    print("Press Ctrl+C to stop collection.")
    print("=" * 60)
    print()


# ============================================================
# NEW MQTT MESSAGE
# ============================================================

def on_message(
    client,
    userdata,
    message,
):

    try:

        # ----------------------------------------------------
        # Decode MQTT JSON
        # ----------------------------------------------------

        payload = message.payload.decode(
            "utf-8"
        )

        data = json.loads(payload)


        # ----------------------------------------------------
        # Extract stage
        # ----------------------------------------------------

        stage = data.get("stage")


        # ----------------------------------------------------
        # Ignore unknown stages
        # ----------------------------------------------------

        if stage not in VALID_STAGES:

            print(
                f"Ignored unknown stage: {stage}"
            )

            return


        # ----------------------------------------------------
        # Extract device
        # ----------------------------------------------------

        device_id = data.get(
            "device_id",
            "UNKNOWN_DEVICE"
        )


        # ----------------------------------------------------
        # Build dataset row
        # ----------------------------------------------------

        row = {

            "timestamp":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "device_id":
                device_id,

            "stage":
                stage,

            "pressure":
                data.get(
                    "pressure_bar"
                ),

            "flow":
                data.get(
                    "flow_L_min"
                ),

            "acoustic":
                data.get(
                    "acoustic_amp"
                ),

            "pH":
                data.get(
                    "pH"
                ),

            "tds":
                data.get(
                    "tds_ppm"
                ),

            "turbidity":
                data.get(
                    "turbidity_NTU"
                ),
        }


        # ----------------------------------------------------
        # Basic validation
        # ----------------------------------------------------

        sensor_fields = [
            "pressure",
            "flow",
            "acoustic",
            "pH",
            "tds",
            "turbidity",
        ]

        missing_fields = [
            field
            for field in sensor_fields
            if row[field] is None
        ]

        if missing_fields:

            print(
                "Ignored incomplete telemetry:"
            )

            print(
                f"  Device: {device_id}"
            )

            print(
                f"  Stage: {stage}"
            )

            print(
                f"  Missing: "
                f"{', '.join(missing_fields)}"
            )

            return


        # ----------------------------------------------------
        # Append Wokwi observation to CSV
        # ----------------------------------------------------

        with open(
            CSV_FILE,
            "a",
            newline="",
            encoding="utf-8",
        ) as file:

            writer = csv.DictWriter(
                file,
                fieldnames=FIELDS,
            )

            writer.writerow(row)


        # ----------------------------------------------------
        # Display collected observation
        # ----------------------------------------------------

        print(
            f"Saved | "
            f"{device_id} | "
            f"{stage:<15} | "
            f"P={row['pressure']} | "
            f"Flow={row['flow']} | "
            f"A={row['acoustic']} | "
            f"pH={row['pH']} | "
            f"TDS={row['tds']} | "
            f"Turb={row['turbidity']}"
        )


    except json.JSONDecodeError:

        print(
            "Ignored invalid JSON message."
        )


    except Exception as error:

        print(
            f"Error processing MQTT message: "
            f"{error}"
        )


# ============================================================
# MQTT CLIENT
# ============================================================

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id="HydroIQ_ML_DataCollector"
)


client.on_connect = on_connect
client.on_message = on_message


# ============================================================
# CONNECT
# ============================================================

print()
print(
    "Connecting to MQTT broker..."
)

client.connect(
    MQTT_BROKER,
    MQTT_PORT,
    60,
)


# ============================================================
# START COLLECTION
# ============================================================

client.loop_forever()