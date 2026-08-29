from .filters import filter_sensor_data
from .leak_detection import detect_leak
from .water_quality import analyze_water_quality
from .wrs import calculate_risk_score


def analyze_sensor_data(sensor_data):
    clean_data = filter_sensor_data(sensor_data)

    leak_result = detect_leak(clean_data)

    quality_result = analyze_water_quality(clean_data)

    risk_result = calculate_risk_score(
        leak_result,
        quality_result
    )

    return {
        "sensor_data": clean_data,
        "leak": leak_result,
        "water_quality": quality_result,
        "risk": risk_result
    }
