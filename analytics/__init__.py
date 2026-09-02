from .filters import filter_sensor_data
from .leak_detection import detect_leak
from .water_quality import analyze_water_quality
from .wrs import calculate_risk_score
from .condition_classifier import classify_condition
from .sensor_health import calculate_sensor_health
from .priority import calculate_priority


def analyze_sensor_data(
    sensor_data,
    location_score=0,
    population=0,
    facilities=None,
    critical_area=False,
    trend_score=0
):
    if facilities is None:
        facilities = []

    raw_data = dict(sensor_data)

    filtered_data = filter_sensor_data(
        raw_data
    )

    leak_result = detect_leak(
        raw_data
    )

    quality_result = analyze_water_quality(
        raw_data
    )

    condition_result = classify_condition(
        raw_data,
        leak_result,
        quality_result
    )

    health_result = calculate_sensor_health(
        raw_data
    )

    risk_result = calculate_risk_score(
        leak_result,
        quality_result,
        sensor_health_result=health_result,
        condition_result=condition_result,
        sensor_data=raw_data,
        population=population,
        facilities=facilities,
        critical_area=critical_area,
        location_score=location_score,
        trend_score=trend_score
    )

    condition = condition_result.get(
        "condition",
        "NORMAL"
    )

    leak_detected = leak_result.get(
        "leak_detected",
        False
    )

    quality_status = quality_result.get(
        "status",
        "Good"
    )

    has_problem = (
        condition != "NORMAL"
        or leak_detected
        or quality_status in (
            "Poor",
            "Moderate",
            "Fair"
        )
    )

    if has_problem:
        priority_result = calculate_priority(
            {
                "condition": condition_result,
                "risk": risk_result,
                "leak": leak_result
            },
            location_score=location_score
        )
    else:
        priority_result = None

    if priority_result is not None:
        priority_result["population"] = population
        priority_result["facilities"] = facilities
        priority_result["critical_area"] = critical_area
        priority_result["trend_score"] = trend_score

    return {
        "sensor_data": raw_data,

        "filtered_sensor_data": filtered_data,

        "leak": leak_result,

        "water_quality": quality_result,

        "condition": condition_result,

        "sensor_health": health_result,

        "risk": risk_result,

        "priority": priority_result,

        "stage": condition,

        "impact": {
            "population": population,
            "facilities": facilities,
            "critical_area": critical_area
        }
    }