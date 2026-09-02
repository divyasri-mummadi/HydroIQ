import csv
import os
import random
from datetime import datetime, timezone, timedelta


# ============================================================
# HYDROIQ REALISTIC ML DATASET GENERATOR
# ============================================================

random.seed(42)


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

CSV_FILE = os.path.join(
    BASE_DIR,
    "ml_dataset.csv"
)


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
# DATASET SIZE
# ============================================================

CLASS_COUNTS = {
    "NORMAL": 800,
    "LEAK": 400,
    "WATER_QUALITY": 400,
    "SENSOR_FAULT": 250,
    "EARLY_ANOMALY": 150,
}


TOTAL_SAMPLES = sum(CLASS_COUNTS.values())


# ============================================================
# DEVICE / ZONE MAPPING
# ============================================================

DEVICES = [
    ("ESP32_Node_1", "Zone_A"),
    ("ESP32_Node_2", "Zone_B"),
    ("ESP32_Node_3", "Zone_C"),
    ("ESP32_Node_4", "Zone_D"),
]


# ============================================================
# RANDOM HELPERS
# ============================================================

def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def normal_value(mean, std, minimum, maximum):
    return round(
        clamp(
            random.gauss(mean, std),
            minimum,
            maximum,
        ),
        3,
    )


def choose_device():
    return random.choice(DEVICES)


# ============================================================
# NORMAL
# ============================================================

def generate_normal():
    pressure = normal_value(
        2.55,
        0.16,
        2.10,
        2.95,
    )

    flow = normal_value(
        120,
        12,
        90,
        150,
    )

    acoustic = normal_value(
        0.55,
        0.12,
        0.20,
        0.95,
    )

    ph = normal_value(
        7.15,
        0.10,
        6.80,
        7.50,
    )

    tds = normal_value(
        310,
        22,
        250,
        370,
    )

    turbidity = normal_value(
        1.7,
        0.35,
        0.8,
        2.8,
    )

    return [
        pressure,
        flow,
        acoustic,
        ph,
        tds,
        turbidity,
    ]


# ============================================================
# LEAK
# ============================================================

def generate_leak():
    pressure = normal_value(
        1.72,
        0.20,
        1.20,
        2.15,
    )

    flow = normal_value(
        165,
        18,
        125,
        220,
    )

    acoustic = normal_value(
        1.65,
        0.28,
        1.00,
        2.30,
    )

    ph = normal_value(
        7.12,
        0.12,
        6.75,
        7.50,
    )

    tds = normal_value(
        315,
        25,
        250,
        390,
    )

    turbidity = normal_value(
        2.0,
        0.40,
        0.8,
        3.2,
    )

    return [
        pressure,
        flow,
        acoustic,
        ph,
        tds,
        turbidity,
    ]


# ============================================================
# EARLY ANOMALY
# ============================================================

def generate_early_anomaly():
    pressure = normal_value(
        2.25,
        0.18,
        1.80,
        2.60,
    )

    flow = normal_value(
        140,
        15,
        105,
        180,
    )

    acoustic = normal_value(
        1.05,
        0.22,
        0.65,
        1.55,
    )

    ph = normal_value(
        7.14,
        0.14,
        6.70,
        7.55,
    )

    tds = normal_value(
        320,
        30,
        245,
        410,
    )

    turbidity = normal_value(
        2.25,
        0.45,
        1.0,
        3.5,
    )

    return [
        pressure,
        flow,
        acoustic,
        ph,
        tds,
        turbidity,
    ]


# ============================================================
# SENSOR FAULT
# ============================================================

def generate_sensor_fault():
    sensor = random.choice(
        [
            "pressure",
            "flow",
            "acoustic",
            "pH",
            "tds",
            "turbidity",
        ]
    )

    values = generate_normal()

    if sensor == "pressure":
        values[0] = random.choice([
            0.0,
            0.05,
            5.5,
            7.0,
        ])

    elif sensor == "flow":
        values[1] = random.choice([
            0.0,
            5.0,
            350.0,
            500.0,
        ])

    elif sensor == "acoustic":
        values[2] = random.choice([
            0.0,
            0.02,
            4.5,
            7.0,
        ])

    elif sensor == "pH":
        values[3] = random.choice([
            2.5,
            3.2,
            11.5,
            13.0,
        ])

    elif sensor == "tds":
        values[4] = random.choice([
            0.0,
            25.0,
            1200.0,
            2000.0,
        ])

    elif sensor == "turbidity":
        values[5] = random.choice([
            0.0,
            0.05,
            20.0,
            40.0,
        ])

    return values


# ============================================================
# WATER QUALITY
# ============================================================

def generate_water_quality():
    pressure = normal_value(
        2.50,
        0.18,
        2.00,
        2.95,
    )

    flow = normal_value(
        120,
        14,
        90,
        155,
    )

    acoustic = normal_value(
        0.58,
        0.14,
        0.20,
        1.00,
    )

    # Several realistic water-quality patterns.
    quality_pattern = random.choice([
        "high_tds",
        "high_turbidity",
        "low_ph",
        "high_ph",
        "combined",
    ])

    if quality_pattern == "high_tds":
        ph = normal_value(
            7.10,
            0.16,
            6.70,
            7.55,
        )

        tds = normal_value(
            520,
            70,
            400,
            700,
        )

        turbidity = normal_value(
            2.3,
            0.45,
            1.2,
            3.5,
        )

    elif quality_pattern == "high_turbidity":
        ph = normal_value(
            7.10,
            0.16,
            6.70,
            7.55,
        )

        tds = normal_value(
            330,
            35,
            250,
            410,
        )

        turbidity = normal_value(
            6.5,
            1.4,
            4.0,
            10.0,
        )

    elif quality_pattern == "low_ph":
        ph = normal_value(
            6.15,
            0.25,
            5.50,
            6.70,
        )

        tds = normal_value(
            330,
            35,
            250,
            420,
        )

        turbidity = normal_value(
            2.4,
            0.5,
            1.0,
            4.0,
        )

    elif quality_pattern == "high_ph":
        ph = normal_value(
            8.35,
            0.25,
            7.80,
            9.00,
        )

        tds = normal_value(
            330,
            35,
            250,
            420,
        )

        turbidity = normal_value(
            2.4,
            0.5,
            1.0,
            4.0,
        )

    else:
        ph = normal_value(
            6.45,
            0.30,
            5.80,
            7.00,
        )

        tds = normal_value(
            500,
            80,
            380,
            700,
        )

        turbidity = normal_value(
            6.0,
            1.5,
            3.5,
            10.0,
        )

    return [
        pressure,
        flow,
        acoustic,
        ph,
        tds,
        turbidity,
    ]


# ============================================================
# GENERATE ONE SAMPLE
# ============================================================

def generate_sample(stage, timestamp):
    device_id, zone = choose_device()

    if stage == "NORMAL":
        values = generate_normal()

    elif stage == "LEAK":
        values = generate_leak()

    elif stage == "EARLY_ANOMALY":
        values = generate_early_anomaly()

    elif stage == "SENSOR_FAULT":
        values = generate_sensor_fault()

    elif stage == "WATER_QUALITY":
        values = generate_water_quality()

    else:
        raise ValueError(
            f"Unknown stage: {stage}"
        )

    return {
        "timestamp": timestamp.isoformat(),
        "device_id": device_id,
        "stage": stage,
        "pressure": values[0],
        "flow": values[1],
        "acoustic": values[2],
        "pH": values[3],
        "tds": values[4],
        "turbidity": values[5],
    }


# ============================================================
# BUILD DATASET
# ============================================================

def build_dataset():

    rows = []

    start_time = (
        datetime.now(timezone.utc)
        - timedelta(days=30)
    )

    for stage, count in CLASS_COUNTS.items():

        for index in range(count):

            timestamp = (
                start_time
                + timedelta(
                    minutes=random.randint(
                        0,
                        30 * 24 * 60,
                    )
                )
            )

            row = generate_sample(
                stage,
                timestamp,
            )

            rows.append(row)


    # Shuffle samples so classes are not grouped together.
    random.shuffle(rows)


    # Sort chronologically after shuffle to make timestamps realistic.
    rows.sort(
        key=lambda row: row["timestamp"]
    )


    return rows


# ============================================================
# WRITE CSV
# ============================================================

def save_dataset(rows):

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

        writer.writerows(rows)


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print("HYDROIQ ML DATASET GENERATOR")
    print("=" * 60)

    print()
    print(
        f"Generating {TOTAL_SAMPLES} realistic samples..."
    )

    rows = build_dataset()

    save_dataset(rows)

    print()
    print("Dataset created successfully.")
    print()
    print(f"Total samples: {len(rows)}")
    print(f"Output file: {CSV_FILE}")

    print()
    print("Class distribution:")

    for stage, count in CLASS_COUNTS.items():
        print(
            f"  {stage:<18} {count}"
        )

    print()
    print("Features:")
    print(
        "  pressure, flow, acoustic, pH, tds, turbidity"
    )

    print()
    print("=" * 60)


if __name__ == "__main__":
    main()