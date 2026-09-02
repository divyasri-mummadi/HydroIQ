def calculate_priority(
    analytics_result,
    ml_result=None,
    sensor_health=None,
    location_score=0
):
    analytics_result = analytics_result or {}
    ml_result = ml_result or {}
    sensor_health = sensor_health or {}

    condition_result = (
        analytics_result.get("condition")
        or {}
    )

    risk = (
        analytics_result.get("risk")
        or {}
    )

    leak = (
        analytics_result.get("leak")
        or {}
    )

    condition = str(
        condition_result.get(
            "condition",
            "NORMAL"
        )
    ).upper()

    severity = str(
        condition_result.get(
            "severity",
            "LOW"
        )
    ).upper()

    leak_detected = bool(
        leak.get(
            "leak_detected",
            False
        )
    )

    problem_conditions = {
        "EARLY_ANOMALY",
        "LEAK",
        "WATER_QUALITY",
        "SENSOR_FAULT",
        "CRITICAL"
    }

    has_problem = (
        condition in problem_conditions
        or leak_detected
    )

    if not has_problem:
        return None

    try:
        wrs = float(
            risk.get(
                "score",
                risk.get("wrs", 0)
            ) or 0
        )
    except (TypeError, ValueError):
        wrs = 0

    wrs = max(
        0,
        min(100, wrs)
    )

    prediction = str(
        ml_result.get(
            "prediction",
            condition
        )
    ).upper()

    if prediction == "UNKNOWN":
        prediction = condition

    try:
        confidence = float(
            ml_result.get(
                "confidence",
                0
            ) or 0
        )
    except (TypeError, ValueError):
        confidence = 0

    confidence = max(
        0,
        min(1, confidence)
    )

    severity_map = {
        "NORMAL": 0,
        "EARLY_ANOMALY": 45,
        "SENSOR_FAULT": 55,
        "WATER_QUALITY": 70,
        "LEAK": 100,
        "CRITICAL": 100
    }

    condition_score = severity_map.get(
        condition,
        0
    )

    ml_score = severity_map.get(
        prediction,
        0
    )

    effective_condition_score = max(
        condition_score,
        ml_score
    )

    try:
        health_score = float(
            sensor_health.get(
                "overall_score",
                100
            ) or 100
        )
    except (TypeError, ValueError):
        health_score = 100

    health_score = max(
        0,
        min(100, health_score)
    )

    try:
        location_score = float(
            location_score or 0
        )
    except (TypeError, ValueError):
        location_score = 0

    location_score = max(
        0,
        min(100, location_score)
    )

    severity_scores = {
        "LOW": 20,
        "MEDIUM": 50,
        "HIGH": 80,
        "CRITICAL": 100
    }

    severity_score = severity_scores.get(
        severity,
        20
    )

    final_severity = max(
        severity_score,
        effective_condition_score
    )

    priority_score = (
        (wrs * 0.50)
        +
        (final_severity * 0.25)
        +
        (location_score * 0.15)
        +
        (health_score * 0.10)
    )

    if condition == "LEAK" or leak_detected:
        priority_score = max(
            priority_score,
            70
        )

    if condition == "CRITICAL":
        priority_score = max(
            priority_score,
            85
        )

    priority_score = max(
        0,
        min(100, priority_score)
    )

    priority_score = round(
        priority_score,
        2
    )

    if priority_score >= 80:
        level = "CRITICAL"
        priority_code = "P1"

    elif priority_score >= 60:
        level = "HIGH"
        priority_code = "P2"

    elif priority_score >= 35:
        level = "MEDIUM"
        priority_code = "P3"

    else:
        level = "LOW"
        priority_code = "P4"

    if condition in (
        "LEAK",
        "CRITICAL"
    ):

        if level == "CRITICAL":
            action = (
                "Immediately isolate the affected zone "
                "and dispatch an emergency repair crew."
            )
            response_time = "Immediate"
            dispatch_required = True

        elif level == "HIGH":
            action = (
                "Dispatch an inspection team urgently "
                "to investigate the affected network segment."
            )
            response_time = "Within 1 hour"
            dispatch_required = True

        else:
            action = (
                "Inspect the network segment for "
                "possible pipeline failure."
            )
            response_time = "Within 24 hours"
            dispatch_required = False

    elif condition == "WATER_QUALITY":

        action = (
            "Verify water-quality readings and inspect "
            "the affected zone before restoring normal operation."
        )
        response_time = "Within 24 hours"
        dispatch_required = True

    elif condition == "EARLY_ANOMALY":

        action = (
            "Monitor the developing anomaly and schedule "
            "a preventive field inspection."
        )
        response_time = "Within 24 hours"
        dispatch_required = False

    elif condition == "SENSOR_FAULT":

        action = (
            "Inspect or recalibrate the affected sensor "
            "and validate readings against nearby nodes."
        )
        response_time = "Within 24 hours"
        dispatch_required = False

    else:

        action = "Continue normal monitoring."
        response_time = "Routine"
        dispatch_required = False

    evidence = [
        f"WRS risk score: {round(wrs, 1)}/100",
        f"Detected condition: {condition}",
        f"Sensor health: {round(health_score, 1)}%"
    ]

    if prediction not in (
        "NORMAL",
        "UNKNOWN"
    ):
        evidence.append(
            f"ML prediction: {prediction}"
        )

    if confidence > 0:
        evidence.append(
            f"ML confidence: {round(confidence * 100)}%"
        )

    if location_score > 0:
        evidence.append(
            f"Location importance: {round(location_score, 1)}/100"
        )

    return {
        "score": priority_score,
        "level": level,
        "priority": priority_code,
        "prediction": prediction,
        "ml_confidence": round(
            confidence,
            4
        ),
        "sensor_health": round(
            health_score,
            2
        ),
        "location_score": round(
            location_score,
            2
        ),
        "condition": condition,
        "severity": severity,
        "reason": (
            f"Priority increased because of: {condition}."
        ),
        "recommended_action": action,
        "response_time": response_time,
        "dispatch_required": dispatch_required,
        "explanation": (
            "Priority combines WRS, condition severity, "
            "location importance and sensor reliability."
        ),
        "evidence": evidence
    }