import json
import math
import random
import time

import paho.mqtt.client as mqtt


# ============================================================
# HydroIQ Python Sensor Simulator
# Replaces Wokwi.
#
# Pipeline:
# Python simulator -> MQTT -> HydroIQ backend -> InfluxDB -> React
# ============================================================

BROKER = "broker.emqx.io"
PORT = 1883

PUBLISH_INTERVAL = 2.0       # seconds
SCENARIO_INTERVAL = 10.0     # seconds

NODES = [
    {
        "device_id": "ESP32_Node_1",
        "topic": "hydrolq/telemetry/node1",
        "start_stage": 0,
        "phase": 0.0,
    },
    {
        "device_id": "ESP32_Node_2",
        "topic": "hydrolq/telemetry/node2",
        "start_stage": 1,
        "phase": 1.5,
    },
    {
        "device_id": "ESP32_Node_3",
        "topic": "hydrolq/telemetry/node3",
        "start_stage": 2,
        "phase": 3.0,
    },
    {
        "device_id": "ESP32_Node_4",
        "topic": "hydrolq/telemetry/node4",
        "start_stage": 3,
        "phase": 4.5,
    },
]

STAGES = [
    "NORMAL",
    "EARLY_ANOMALY",
    "LEAK",
    "SENSOR_FAULT",
    "WATER_QUALITY",
]


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def scenario_for_node(node_index, elapsed_seconds):
    block = int(elapsed_seconds // SCENARIO_INTERVAL)

    # Stagger the four nodes so they do NOT all show the same state.
    # Node 1 starts NORMAL
    # Node 2 starts EARLY_ANOMALY
    # Node 3 starts LEAK
    # Node 4 starts SENSOR_FAULT
    stage_index = (NODES[node_index]["start_stage"] + block) % len(STAGES)

    return STAGES[stage_index]


def make_payload(node_index, elapsed_seconds):
    node = NODES[node_index]
    stage = scenario_for_node(node_index, elapsed_seconds)

    t = elapsed_seconds + node["phase"]

    # Smooth movement + small random sensor noise.
    wave = math.sin(t * 1.4)

    pressure = 3.00 + 0.10 * wave + random.uniform(-0.04, 0.04)
    flow = 118.0 + 5.0 * math.sin(t * 1.1) + random.uniform(-2.0, 2.0)
    acoustic = 0.35 + 0.08 * abs(wave) + random.uniform(-0.03, 0.03)

    ph = 7.10 + 0.10 * math.sin(t * 0.7) + random.uniform(-0.05, 0.05)
    tds = 315.0 + 12.0 * math.sin(t * 0.5) + random.uniform(-5.0, 5.0)
    turbidity = 2.0 + 0.25 * abs(wave) + random.uniform(-0.10, 0.10)

    # --------------------------------------------------------
    # Stage-specific behavior
    # --------------------------------------------------------

    if stage == "NORMAL":
        pressure = pressure
        flow = flow
        acoustic = acoustic
        ph = clamp(ph, 6.9, 7.4)
        tds = clamp(tds, 280.0, 360.0)
        turbidity = clamp(turbidity, 1.0, 3.0)

    elif stage == "EARLY_ANOMALY":
        # Subtle deterioration: enough for ML/anomaly logic to notice.
        pressure -= 0.35 + 0.08 * abs(wave)
        flow += 8.0 + 2.0 * abs(wave)
        acoustic += 0.65 + 0.15 * abs(wave)
        ph += random.uniform(-0.12, 0.02)
        turbidity += 1.0

    elif stage == "LEAK":
        # Strong pressure drop + flow increase + acoustic signature.
        pressure *= 0.60
        flow += 28.0 + 4.0 * abs(wave)
        acoustic += 2.8 + 0.5 * abs(wave)

        # Occasionally push turbidity above the soil-intrusion threshold.
        if random.random() < 0.75:
            turbidity += 4.5 + random.uniform(0.0, 1.5)

    elif stage == "SENSOR_FAULT":
        # Simulated bad pH/TDS sensor readings while hydraulic values
        # remain mostly stable.
        ph = 0.0
        tds = 0.0
        pressure += random.uniform(-0.05, 0.05)
        flow += random.uniform(-1.5, 1.5)
        acoustic = clamp(acoustic, 0.2, 0.7)

    elif stage == "WATER_QUALITY":
        ph = 5.8 + random.uniform(-0.12, 0.12)
        tds = 650.0 + 25.0 * math.sin(t * 0.8) + random.uniform(-15.0, 15.0)
        turbidity = 6.0 + 0.8 * abs(wave) + random.uniform(-0.3, 0.3)

        # Hydraulic values remain comparatively normal.
        pressure += random.uniform(-0.05, 0.05)
        flow += random.uniform(-2.0, 2.0)

    payload = {
        "device_id": node["device_id"],
        "stage": stage,
        "pressure_bar": round(max(0.0, pressure), 2),
        "flow_L_min": round(max(0.0, flow), 2),
        "acoustic_amp": round(max(0.0, acoustic), 2),
        "pH": round(max(0.0, ph), 2),
        "tds_ppm": round(max(0.0, tds), 2),
        "turbidity_NTU": round(max(0.0, turbidity), 2),
    }

    return payload


def on_connect(client, userdata, flags, reason_code, properties=None):
    print(f"MQTT connected: {reason_code}")
    print()
    print("HydroIQ simulator is publishing:")
    for node in NODES:
        print(f"  {node['device_id']} -> {node['topic']}")
    print()
    print("Initial stages:")
    for index, node in enumerate(NODES):
        print(f"  {node['device_id']}: {scenario_for_node(index, 0)}")
    print()
    print("Press Ctrl+C to stop.")
    print()


def on_disconnect(client, userdata, disconnect_flags, reason_code, properties=None):
    print(f"MQTT disconnected: {reason_code}")


def create_client():
    # Unique client ID avoids accidentally sharing an MQTT session.
    client_id = f"hydroiq-python-sim-{random.randint(100000, 999999)}"

    # Works with current Paho versions.
    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=client_id,
        protocol=mqtt.MQTTv311,
    )

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect

    # Public broker does not require authentication.
    return client


def main():
    print("==============================================")
    print("       HydroIQ Python Sensor Simulator")
    print("==============================================")
    print(f"Broker: {BROKER}:{PORT}")
    print(f"Telemetry interval: {PUBLISH_INTERVAL:.0f}s")
    print(f"Scenario interval: {SCENARIO_INTERVAL:.0f}s")
    print()

    client = create_client()

    print("Connecting to MQTT broker...")
    client.connect(BROKER, PORT, keepalive=60)
    client.loop_start()

    boot_time = time.monotonic()
    last_stage_block = -1

    try:
        while True:
            elapsed = time.monotonic() - boot_time

            current_stage_block = int(elapsed // SCENARIO_INTERVAL)

            if current_stage_block != last_stage_block:
                print()
                print(
                    f"--- Scenario block {current_stage_block} "
                    f"(t={elapsed:.0f}s) ---"
                )

                for index, node in enumerate(NODES):
                    print(
                        f"{node['device_id']}: "
                        f"{scenario_for_node(index, elapsed)}"
                    )

                print()
                last_stage_block = current_stage_block

            for index, node in enumerate(NODES):
                payload = make_payload(index, elapsed)
                message = json.dumps(payload)

                result = client.publish(
                    node["topic"],
                    message,
                    qos=0,
                    retain=False,
                )

                if result.rc == mqtt.MQTT_ERR_SUCCESS:
                    print(
                        f"[{time.strftime('%H:%M:%S')}] "
                        f"{node['device_id']} | "
                        f"{payload['stage']:14} | "
                        f"P={payload['pressure_bar']:4.2f} bar | "
                        f"F={payload['flow_L_min']:6.2f} L/min | "
                        f"A={payload['acoustic_amp']:4.2f} | "
                        f"pH={payload['pH']:4.2f} | "
                        f"TDS={payload['tds_ppm']:6.1f} | "
                        f"NTU={payload['turbidity_NTU']:4.2f}"
                    )
                else:
                    print(
                        f"Publish failed for {node['device_id']}: "
                        f"{result.rc}"
                    )

            time.sleep(PUBLISH_INTERVAL)

    except KeyboardInterrupt:
        print()
        print("Stopping HydroIQ simulator...")

    finally:
        client.loop_stop()
        client.disconnect()
        print("Simulator stopped.")


if __name__ == "__main__":
    main()
