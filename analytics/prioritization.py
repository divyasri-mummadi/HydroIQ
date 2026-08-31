# ============================================================
# HYDROIQ PRIORITIZATION ENGINE
# ============================================================

def calculate_priority(analytics_result, ml_result, sensor_health):
    """
    Combines existing risk information, ML prediction,
    ML confidence and sensor health to calculate an
    operator-oriented priority.
    """

    # --------------------------------------------------------
    # EXISTING RISK SCORE
    # --------------------------------------------------------

    risk = analytics_result.get("risk", {})

    base_risk = float(
        risk.get("score", 0)
    )

    # Keep the score within 0-100
    base_risk = max(
        0,
        min(100, base_risk)
    )


    # --------------------------------------------------------
    # ML PREDICTION
    # --------------------------------------------------------

    prediction = ml_result.get(
        "prediction",
        "UNKNOWN"
    )

    confidence = float(
        ml_result.get("confidence", 0)
    )

    # Confidence is expected between 0 and 1
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
        "LEAK": 100
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
        )
    )

    health_score = max(
        0,
        min(100, health_score)
    )


    # --------------------------------------------------------
    # EFFECTIVE ML SEVERITY
    # --------------------------------------------------------
    #
    # If sensors are unhealthy, we reduce the influence
    # of the ML prediction.
    #
    # Example:
    #
    # ML says LEAK with 95% confidence
    # but sensor health is only 50%
    #
    # → effective confidence becomes lower.
    # --------------------------------------------------------

    effective_ml_severity = (
        ml_severity
        * confidence
        * (health_score / 100)
    )


    # --------------------------------------------------------
    # FINAL PRIORITY SCORE
    # --------------------------------------------------------
    #
    # 50% existing risk
    # 40% ML severity/confidence
    # 10% sensor reliability
    #
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
    # RECOMMENDED ACTION
    # --------------------------------------------------------

    if prediction == "LEAK":

        if priority == "CRITICAL":
            action = (
                "Immediate inspection and leak isolation "
                "recommended."
            )

        elif priority == "HIGH":
            action = (
                "Dispatch inspection team to investigate "
                "possible leak."
            )

        else:
            action = (
                "Inspect network segment for possible leak."
            )

    elif prediction == "EARLY_ANOMALY":

        action = (
            "Monitor trend and schedule preventive inspection."
        )

    elif prediction == "SENSOR_FAULT":

        action = (
            "Inspect or recalibrate the affected sensor."
        )

    else:

        action = (
            "Continue normal monitoring."
        )


    # --------------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------------

    return {
        "score": round(
            priority_score,
            2
        ),

        "level": priority,

        "prediction": prediction,

        "ml_confidence": round(
            confidence,
            4
        ),

        "sensor_health": round(
            health_score,
            2
        ),

        "recommended_action": action
    }