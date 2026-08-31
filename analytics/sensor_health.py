SENSOR_RANGES = {
    "pressure": (0, 10),
    "flow": (0, 500),
    "acoustic": (0, 1),
    "ph": (0, 14),
    "tds": (0, 1000),
    "turbidity": (0, 100),
}


def calculate_sensor_health(sensor_data):
    sensors = {}

    for name, (minimum, maximum) in SENSOR_RANGES.items():
        value = sensor_data.get(name)

        if value is None:
            score = 0
            status = "Fault"

        elif value < minimum or value > maximum:
            score = 50
            status = "Warning"

        else:
            score = 100
            status = "Healthy"

        sensors[name] = {
            "score": score,
            "status": status
        }

    overall_score = round(
        sum(sensor["score"] for sensor in sensors.values())
        / len(sensors)
    )

    if overall_score >= 80:
        overall_status = "Healthy"
    elif overall_score >= 50:
        overall_status = "Warning"
    else:
        overall_status = "Fault"

    return {
        "overall_score": overall_score,
        "status": overall_status,
        "sensors": sensors
    }