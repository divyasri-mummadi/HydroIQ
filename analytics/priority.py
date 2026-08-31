def calculate_priority(data):

    condition = data.get(
        "condition",
        {}
    )

    risk = data.get(
        "risk",
        {}
    )

    leak = data.get(
        "leak",
        {}
    )


    # ============================================================
    # BASIC INFORMATION
    # ============================================================

    condition_name = condition.get(
        "condition",
        "NORMAL"
    )

    severity = condition.get(
        "severity",
        "LOW"
    )

    risk_score = risk.get(
        "score",
        0
    )

    leak_detected = leak.get(
        "leak_detected",
        False
    )


    # ============================================================
    # LOCATION INFORMATION
    # ============================================================

    location_score = data.get(
        "location_score",
        0
    )

    critical_area = data.get(
        "critical_area",
        False
    )


    # ============================================================
    # CHECK WHETHER A REAL PROBLEM EXISTS
    #
    # NORMAL + WRS 0 = NO PRIORITY
    #
    # Location alone can NEVER create priority.
    # ============================================================

    problem_exists = (

        leak_detected

        or risk_score > 0

        or condition_name in [

            "LEAK",
            "EARLY_ANOMALY",
            "SENSOR_FAULT",
            "CRITICAL",
            "WATER_QUALITY"

        ]

    )


    # ============================================================
    # NO PROBLEM
    # ============================================================

    if not problem_exists:

        return None


    # ============================================================
    # BASE PRIORITY SCORE
    # ============================================================

    score = risk_score


    # ============================================================
    # CONDITION
    # ============================================================

    if condition_name == "LEAK":

        score += 25

    elif condition_name == "CRITICAL":

        score += 25

    elif condition_name == "SENSOR_FAULT":

        score += 15

    elif condition_name == "WATER_QUALITY":

        score += 20

    elif condition_name == "EARLY_ANOMALY":

        score += 10


    # ============================================================
    # SEVERITY
    # ============================================================

    if severity == "CRITICAL":

        score += 20

    elif severity == "HIGH":

        score += 15

    elif severity == "MEDIUM":

        score += 8

    elif severity == "LOW":

        score += 3


    # ============================================================
    # LOCATION
    #
    # Location matters ONLY because a problem already exists.
    # ============================================================

    score += location_score


    # Critical infrastructure gets extra importance.

    if critical_area:

        score += 10


    # ============================================================
    # CONFIRMED LEAK
    # ============================================================

    if leak_detected:

        score += 20


    # ============================================================
    # LIMIT
    # ============================================================

    score = min(
        round(score),
        100
    )


    # ============================================================
    # PRIORITY LEVEL
    # ============================================================

    if score >= 80:

        priority = "P1"
        level = "CRITICAL"

    elif score >= 60:

        priority = "P2"
        level = "HIGH"

    elif score >= 35:

        priority = "P3"
        level = "MEDIUM"

    else:

        priority = "P4"
        level = "LOW"


    # ============================================================
    # RETURN
    # ============================================================

    return {

        "priority": priority,

        "level": level,

        "score": score,

        "location_score": location_score

    }