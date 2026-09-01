# ============================================================
# HYDROIQ PRIORITIZATION ENGINE
# ============================================================

def calculate_priority(analytics_result, ml_result, sensor_health):
    """
    Combines:
        - Existing WRS / risk score
        - ML prediction
        - ML confidence
        - Sensor health

    Produces an operator-oriented maintenance priority.
    """

    analytics_result = analytics_result or {}
    ml_result = ml_result or {}
    sensor_health = sensor_health or {}

    # --------------------------------------------------------
    # EXISTING RISK / WRS SCORE
    # --------------------------------------------------------

    risk = analytics_result.get("risk") or {}

    base_risk = float(
        risk.get("score", 0) or 0
    )

    base_risk = max(
        0,
        min(100, base_risk)
    )

    # --------------------------------------------------------
    # ML PREDICTION
    # --------------------------------------------------------

    prediction = str(
        ml_result.get(
            "prediction",
            analytics_result.get("condition", {}).get(
                "condition",
                "UNKNOWN"
            )
        )
    ).upper()

    confidence = float(
        ml_result.get("confidence", 0) or 0
    )

    confidence = max(
        0,
        min(1, confidence)
    )

    # --------------------------------------------------------
    # ML SEVERITY
    # --------------------------------------------------------

    severity_map = {
        "NORMAL": 0,
        "EARLY_ANOMALY": 45,
        "SENSOR_FAULT": 55,
        "WATER_QUALITY": 70,
        "LEAK": 100,
        "CRITICAL": 100
    }

    ml_severity = severity_map.get(
        prediction,
        0
    )

    # --------------------------------------------------------
    # SENSOR HEALTH
    # --------------------------------------------------------

    health_score = float(
        sensor_health.get(
            "overall_score",
            100
        ) or 100
    )

    health_score = max(
        0,
        min(100, health_score)
    )

    # --------------------------------------------------------
    # EFFECTIVE ML SEVERITY
    # --------------------------------------------------------

    effective_ml_severity = (
        ml_severity
        * confidence
        * (health_score / 100)
    )

    # --------------------------------------------------------
    # FINAL PRIORITY SCORE
    #
    # 50% WRS / existing risk
    # 40% ML severity + confidence
    # 10% sensor reliability
    # --------------------------------------------------------

    priority_score = (
        (base_risk * 0.50)
        +
        (effective_ml_severity * 0.40)
        +
        (health_score * 0.10)
    )

    priority_score = max(
        0,
        min(100, priority_score)
    )

    priority_score = round(
        priority_score,
        2
    )

    # --------------------------------------------------------
    # PRIORITY LEVEL
    # --------------------------------------------------------

    if prediction == "NORMAL":

        if priority_score < 35:
            priority = "LOW"
        else:
            priority = "MEDIUM"

    elif priority_score >= 80:

        priority = "CRITICAL"

    elif priority_score >= 60:

        priority = "HIGH"

    elif priority_score >= 35:

        priority = "MEDIUM"

    else:

        priority = "LOW"

    # --------------------------------------------------------
    # PRIORITY CODE
    #
    # Useful for frontend and maintenance queue.
    # --------------------------------------------------------

    priority_code = {
        "CRITICAL": "P1",
        "HIGH": "P2",
        "MEDIUM": "P3",
        "LOW": "P4"
    }.get(
        priority,
        "P4"
    )

    # --------------------------------------------------------
    # RECOMMENDED ACTION
    # --------------------------------------------------------

    if prediction in ("LEAK", "CRITICAL"):

        if priority == "CRITICAL":

            action = (
                "Immediately isolate the affected zone "
                "and dispatch an emergency repair crew."
            )

            response_time = "Immediate"
            dispatch_required = True

        elif priority == "HIGH":

            action = (
                "Dispatch an inspection team urgently "
                "to investigate the possible leak."
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

    elif prediction == "WATER_QUALITY":

        action = (
            "Verify water-quality readings and inspect "
            "the affected zone before restoring normal operation."
        )

        response_time = "Within 24 hours"
        dispatch_required = True

    elif prediction == "EARLY_ANOMALY":

        action = (
            "Monitor the trend and schedule "
            "a preventive field inspection."
        )

        response_time = "Within 24 hours"
        dispatch_required = False

    elif prediction == "SENSOR_FAULT":

        action = (
            "Inspect or recalibrate the affected sensor "
            "and validate readings against nearby nodes."
        )

        response_time = "Within 24 hours"
        dispatch_required = False

    else:

        action = (
            "Continue normal monitoring."
        )

        response_time = "Routine"
        dispatch_required = False

    # --------------------------------------------------------
    # EXPLANATION
    # --------------------------------------------------------

    evidence = []

    if base_risk > 0:
        evidence.append(
            f"WRS risk score: {round(base_risk, 1)}/100"
        )

    if prediction != "NORMAL" and prediction != "UNKNOWN":
        evidence.append(
            f"ML condition: {prediction}"
        )

    if confidence > 0:
        evidence.append(
            f"ML confidence: {round(confidence * 100)}%"
        )

    evidence.append(
        f"Sensor health: {round(health_score, 1)}%"
    )

    explanation = (
        "Priority is based on WRS risk, predicted condition, "
        "model confidence and sensor reliability."
    )

    # --------------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------------

    return {
        "score": priority_score,

        "level": priority,

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

        "recommended_action": action,

        "response_time": response_time,

        "dispatch_required": dispatch_required,

        "explanation": explanation,

        "evidence": evidence
    }