def calculate_priority(data):
    """
    HydroIQ Maintenance Priority Engine

    Converts:
        WRS + condition + leak + location
        ↓
        P1 / P2 / P3 / P4
        ↓
        Recommended maintenance action
    """

    data = data or {}

    condition = data.get("condition") or {}
    risk = data.get("risk") or {}
    leak = data.get("leak") or {}

    # ============================================================
    # BASIC INFORMATION
    # ============================================================

    condition_name = str(
        condition.get("condition", "NORMAL")
    ).upper()

    severity = str(
        condition.get("severity", "LOW")
    ).upper()

    risk_score = float(
        risk.get("score", 0) or 0
    )

    leak_detected = bool(
        leak.get("leak_detected", False)
    )

    # ============================================================
    # LOCATION / IMPACT
    # ============================================================

    location_score = float(
        data.get("location_score", 0) or 0
    )

    critical_area = bool(
        data.get("critical_area", False)
    )

    population = int(
        data.get("population", 0) or 0
    )

    # ============================================================
    # CHECK WHETHER A REAL PROBLEM EXISTS
    # ============================================================

    problem_conditions = {
        "LEAK",
        "EARLY_ANOMALY",
        "SENSOR_FAULT",
        "WATER_QUALITY",
        "CRITICAL"
    }

    problem_exists = (
        leak_detected
        or risk_score > 0
        or condition_name in problem_conditions
    )

    # ============================================================
    # NORMAL NETWORK
    # ============================================================

    if not problem_exists:

        return {
            "priority": "P4",
            "level": "LOW",
            "score": 0,
            "location_score": location_score,
            "reason": "Network operating normally.",
            "recommended_action": "Continue routine monitoring.",
            "response_time": "Routine",
            "dispatch_required": False
        }

    # ============================================================
    # START WITH WRS
    #
    # IMPORTANT:
    # WRS remains the main risk signal.
    # We are NOT changing your friend's WRS algorithm.
    # ============================================================

    score = risk_score

    evidence = []

    # ============================================================
    # CONDITION WEIGHT
    # ============================================================

    condition_weights = {
        "LEAK": 25,
        "CRITICAL": 25,
        "SENSOR_FAULT": 15,
        "WATER_QUALITY": 20,
        "EARLY_ANOMALY": 10
    }

    condition_weight = condition_weights.get(
        condition_name,
        0
    )

    score += condition_weight

    if condition_name != "NORMAL":
        evidence.append(condition_name)

    # ============================================================
    # SEVERITY WEIGHT
    # ============================================================

    severity_weights = {
        "CRITICAL": 20,
        "HIGH": 15,
        "MEDIUM": 8,
        "LOW": 3
    }

    severity_weight = severity_weights.get(
        severity,
        0
    )

    score += severity_weight

    # ============================================================
    # CONFIRMED LEAK
    # ============================================================

    if leak_detected:

        score += 20

        evidence.append(
            "Confirmed leak detection"
        )

    # ============================================================
    # LOCATION IMPACT
    #
    # Location only increases priority when a problem exists.
    # ============================================================

    score += location_score

    if location_score > 0:

        evidence.append(
            "Location impact"
        )

    # ============================================================
    # CRITICAL INFRASTRUCTURE
    # ============================================================

    if critical_area:

        score += 10

        evidence.append(
            "Critical infrastructure"
        )

    # ============================================================
    # POPULATION IMPACT
    #
    # Large populations should increase response urgency.
    # ============================================================

    if population >= 5000:

        score += 15
        evidence.append(
            "Very high population impact"
        )

    elif population >= 2500:

        score += 10
        evidence.append(
            "High population impact"
        )

    elif population >= 1000:

        score += 5
        evidence.append(
            "Significant population impact"
        )

    # ============================================================
    # LIMIT SCORE
    # ============================================================

    score = min(
        round(score),
        100
    )

    # ============================================================
    # PRIORITY CLASSIFICATION
    # ============================================================

    if score >= 80:

        priority = "P1"
        level = "CRITICAL"

        recommended_action = (
            "Immediately isolate the affected zone "
            "and dispatch an emergency repair crew."
        )

        response_time = "Immediate"

        dispatch_required = True

    elif score >= 60:

        priority = "P2"
        level = "HIGH"

        recommended_action = (
            "Dispatch an inspection crew urgently "
            "and investigate the affected zone."
        )

        response_time = "Within 1 hour"

        dispatch_required = True

    elif score >= 35:

        priority = "P3"
        level = "MEDIUM"

        recommended_action = (
            "Schedule a field inspection and "
            "continue close monitoring."
        )

        response_time = "Within 24 hours"

        dispatch_required = False

    else:

        priority = "P4"
        level = "LOW"

        recommended_action = (
            "Continue routine monitoring."
        )

        response_time = "Routine"

        dispatch_required = False

    # ============================================================
    # INTELLIGENT OVERRIDES
    #
    # Certain conditions should never be treated as low priority.
    # ============================================================

    if leak_detected and priority in {"P3", "P4"}:

        priority = "P2"
        level = "HIGH"

        recommended_action = (
            "Dispatch an inspection crew urgently "
            "and investigate the confirmed leak."
        )

        response_time = "Within 1 hour"

        dispatch_required = True

    if condition_name == "SENSOR_FAULT":

        if priority == "P4":

            priority = "P3"
            level = "MEDIUM"

        recommended_action = (
            "Inspect or recalibrate the affected "
            "sensor node."
        )

        response_time = "Within 24 hours"

    if condition_name == "WATER_QUALITY":

        if priority == "P4":

            priority = "P3"
            level = "MEDIUM"

        recommended_action = (
            "Inspect water-quality conditions "
            "and verify pH, TDS and turbidity readings."
        )

        response_time = "Within 24 hours"

    # ============================================================
    # EXPLANATION FOR AI / UI
    # ============================================================

    if evidence:

        reason = (
            "Priority increased because of: "
            + ", ".join(evidence)
            + "."
        )

    else:

        reason = (
            "Priority determined from the current "
            "HydroIQ risk score and operating condition."
        )

    # ============================================================
    # FINAL RESULT
    # ============================================================

    return {
        "priority": priority,
        "level": level,
        "score": score,
        "location_score": location_score,

        "condition": condition_name,
        "severity": severity,

        "reason": reason,

        "recommended_action": recommended_action,

        "response_time": response_time,

        "dispatch_required": dispatch_required,

        "evidence": evidence
    }