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
    critical_area=False
):

    # ============================================================
    # 1. CLEAN SENSOR DATA
    # ============================================================

    clean_data = filter_sensor_data(
        sensor_data
    )


    # ============================================================
    # 2. LEAK DETECTION
    # ============================================================

    leak_result = detect_leak(
        clean_data
    )


    # ============================================================
    # 3. WATER QUALITY
    # ============================================================

    quality_result = analyze_water_quality(
        clean_data
    )


    # ============================================================
    # 4. CONDITION CLASSIFICATION
    # ============================================================

    condition_result = classify_condition(
        clean_data,
        leak_result,
        quality_result
    )


    # ============================================================
    # 5. SENSOR HEALTH
    # ============================================================

    health_result = calculate_sensor_health(
        clean_data
    )


    # ============================================================
    # 6. WATER RISK SCORE
    #
    # IMPORTANT:
    # wrs.py now expects THREE arguments.
    # ============================================================

    risk_result = calculate_risk_score(

        clean_data,

        leak_result,

        quality_result

    )


    # ============================================================
    # 7. PRIORITY
    #
    # Location only influences priority when there is already
    # an actual problem.
    # ============================================================

    priority_result = calculate_priority({

        "condition": condition_result,

        "risk": risk_result,

        "leak": leak_result,

        "location_score": location_score,

        "critical_area": critical_area

    })


    # ============================================================
    # 8. RETURN
    # ============================================================

    return {

        "sensor_data": clean_data,

        "leak": leak_result,

        "water_quality": quality_result,

        "condition": condition_result,

        "sensor_health": health_result,

        "risk": risk_result,

        "priority": priority_result

    }