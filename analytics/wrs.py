def calculate_risk_score(
    leak_result,
    quality_result,
    sensor_health_result=None,
    condition_result=None,
    sensor_data=None,
    population=0,
    facilities=None,
    critical_area=False,
    location_score=0,
    trend_score=0,
    ml_result=None
):
    """
    Calculates the HydroIQ Water Risk Score (WRS).

    WRS = 0.35R + 0.25S + 0.20I + 0.10L + 0.10T

    R = Sensor Risk       35%
    S = Severity          25%
    I = Impact            20%
    L = Location          10%
    T = Trend             10%

    All components are normalized to 0-100.
    Final WRS is 0-100.
    """

    # ============================================================
    # DEFAULT VALUES
    # ============================================================

    sensor_health_result = sensor_health_result or {}
    condition_result = condition_result or {}
    sensor_data = sensor_data or {}
    facilities = facilities or []
    ml_result = ml_result or {}

    # ============================================================
    # BASIC RESULTS
    # ============================================================

    condition = condition_result.get(
        "condition",
        "NORMAL"
    )

    severity = condition_result.get(
        "severity",
        "LOW"
    )

    leak_detected = leak_result.get(
        "leak_detected",
        False
    )

    quality_status = quality_result.get(
        "status",
        "Good"
    )

    sensor_health_status = sensor_health_result.get(
        "status",
        "Healthy"
    )

    # ============================================================
    # NORMAL ZONE
    # ============================================================

    if (
        condition == "NORMAL"
        and not leak_detected
        and quality_status == "Good"
        and sensor_health_status == "Healthy"
    ):
        return {
            "score": 0,
            "wrs": 0,
            "level": "Low",

            "components": {
                "sensor_risk": 0,
                "severity": 0,
                "impact": 0,
                "location_impact": 0,
                "trend": 0
            }
        }

    # ============================================================
    # SENSOR DATA
    # ============================================================

    pressure = sensor_data.get(
        "pressure",
        0
    )

    flow = sensor_data.get(
        "flow",
        0
    )

    acoustic = sensor_data.get(
        "acoustic",
        0
    )

    ph = sensor_data.get(
        "ph",
        7
    )

    tds = sensor_data.get(
        "tds",
        0
    )

    turbidity = sensor_data.get(
        "turbidity",
        0
    )

    # ============================================================
    # 1. SENSOR RISK - R
    # ============================================================
    #
    # Internal sensor-risk weights:
    #
    # Pressure    20%
    # Flow        20%
    # Acoustic    25%
    # pH          10%
    # Turbidity   10%
    # TDS         10%
    # ML/Anomaly   5%
    #
    # Total       100%
    #
    # This entire component contributes 35% to WRS.
    # ============================================================

    # ------------------------------------------------------------
    # Pressure risk
    # ------------------------------------------------------------

    if pressure < 2.0:
        pressure_risk = 100

    elif pressure < 2.3:
        pressure_risk = 60

    elif pressure < 2.5:
        pressure_risk = 30

    else:
        pressure_risk = 0

    # ------------------------------------------------------------
    # Flow risk
    # ------------------------------------------------------------

    if flow > 150:
        flow_risk = 100

    elif flow > 130:
        flow_risk = 60

    elif flow > 120:
        flow_risk = 30

    else:
        flow_risk = 0

    # ------------------------------------------------------------
    # Acoustic risk
    # ------------------------------------------------------------

    if acoustic > 0.85:
        acoustic_risk = 100

    elif acoustic > 0.70:
        acoustic_risk = 70

    elif acoustic > 0.60:
        acoustic_risk = 30

    else:
        acoustic_risk = 0

    # ------------------------------------------------------------
    # pH risk
    # ------------------------------------------------------------

    if ph < 6.0 or ph > 9.0:
        ph_risk = 100

    elif ph < 6.6 or ph > 8.4:
        ph_risk = 60

    else:
        ph_risk = 0

    # ------------------------------------------------------------
    # Turbidity risk
    # ------------------------------------------------------------

    if turbidity > 5:
        turbidity_risk = 100

    elif turbidity > 4:
        turbidity_risk = 60

    else:
        turbidity_risk = 0

    # ------------------------------------------------------------
    # TDS risk
    # ------------------------------------------------------------

    if tds > 500:
        tds_risk = 100

    elif tds > 450:
        tds_risk = 60

    else:
        tds_risk = 0

    # ------------------------------------------------------------
    # ML / anomaly risk
    # ------------------------------------------------------------

    ml_prediction = str(
        ml_result.get(
            "prediction",
            ""
        )
    ).upper()

    ml_confidence = ml_result.get(
        "confidence",
        0
    )

    try:
        ml_confidence = float(
            ml_confidence
        )

    except (
        TypeError,
        ValueError
    ):
        ml_confidence = 0

    # Normalize confidence if given as 0-1
    if ml_confidence <= 1:
        ml_confidence *= 100

    ml_confidence = max(
        0,
        min(
            ml_confidence,
            100
        )
    )

    # If ML predicts an abnormal condition,
    # use its confidence as anomaly risk.
    abnormal_labels = {
        "LEAK",
        "ANOMALY",
        "CRITICAL",
        "EARLY_ANOMALY",
        "WATER_QUALITY",
        "SENSOR_FAULT"
    }

    if ml_prediction in abnormal_labels:
        ml_risk = ml_confidence
    else:
        ml_risk = 0

    # ------------------------------------------------------------
    # Final Sensor Risk
    # ------------------------------------------------------------

    sensor_risk = (
        pressure_risk * 0.20
        + flow_risk * 0.20
        + acoustic_risk * 0.25
        + ph_risk * 0.10
        + turbidity_risk * 0.10
        + tds_risk * 0.10
        + ml_risk * 0.05
    )

    sensor_risk = max(
        0,
        min(
            sensor_risk,
            100
        )
    )

    # ============================================================
    # 2. SEVERITY - S
    # ============================================================

    severity_scores = {
        "LOW": 20,
        "MEDIUM": 50,
        "HIGH": 80,
        "CRITICAL": 100
    }

    condition_scores = {
        "NORMAL": 0,
        "EARLY_ANOMALY": 40,
        "WATER_QUALITY": 65,
        "SENSOR_FAULT": 75,
        "LEAK": 90,
        "CRITICAL": 100
    }

    severity_score = severity_scores.get(
        severity,
        0
    )

    condition_score = condition_scores.get(
        condition,
        0
    )

    severity_component = max(
        severity_score,
        condition_score
    )

    # ============================================================
    # 3. IMPACT - I
    # ============================================================
    #
    # Impact contains:
    #
    # Population      50%
    # Facilities      30%
    # Critical area   20%
    #
    # The resulting Impact Score contributes 20% to WRS.
    # ============================================================

    # ------------------------------------------------------------
    # Population impact
    # ------------------------------------------------------------

    try:
        population = float(
            population
        )

    except (
        TypeError,
        ValueError
    ):
        population = 0

    population_score = min(
        (population / 2500) * 100,
        100
    )

    # ------------------------------------------------------------
    # Facility impact
    # ------------------------------------------------------------

    facility_score = 0

    for facility in facilities:

        facility_name = str(
            facility
        ).lower()

        # Critical facilities
        if (
            "hospital" in facility_name
            or "water treatment" in facility_name
            or "treatment" in facility_name
        ):
            facility_score = max(
                facility_score,
                100
            )

        # Important public facilities
        elif (
            "school" in facility_name
            or "college" in facility_name
        ):
            facility_score = max(
                facility_score,
                60
            )

        # Residential areas
        elif "residential" in facility_name:

            facility_score = max(
                facility_score,
                30
            )

    # ------------------------------------------------------------
    # Critical area
    # ------------------------------------------------------------

    critical_score = (
        100
        if critical_area
        else 0
    )

    # ------------------------------------------------------------
    # Overall Impact
    # ------------------------------------------------------------

    impact_score = (
        population_score * 0.50
        + facility_score * 0.30
        + critical_score * 0.20
    )

    impact_score = max(
        0,
        min(
            impact_score,
            100
        )
    )

    # ============================================================
    # 4. LOCATION - L
    # ============================================================

    try:
        location_score = float(
            location_score
        )

    except (
        TypeError,
        ValueError
    ):
        location_score = 0

    location_score = max(
        0,
        min(
            location_score,
            100
        )
    )

    # ============================================================
    # 5. TREND - T
    # ============================================================

    try:
        trend_score = float(
            trend_score
        )

    except (
        TypeError,
        ValueError
    ):
        trend_score = 0

    trend_score = max(
        0,
        min(
            trend_score,
            100
        )
    )

    # ============================================================
    # FINAL WRS
    # ============================================================
    #
    # R = 35%
    # S = 25%
    # I = 20%
    # L = 10%
    # T = 10%
    #
    # Total = 100%
    # ============================================================

    wrs = (
        sensor_risk * 0.35
        + severity_component * 0.25
        + impact_score * 0.20
        + location_score * 0.10
        + trend_score * 0.10
    )

    # ============================================================
    # CONFIRMED LEAK FLOOR
    # ============================================================
    #
    # If a leak is detected, the zone cannot be classified
    # as Low risk.
    # ============================================================

    if leak_detected:

        wrs = max(
            wrs,
            60
        )

    # ============================================================
    # LIMIT WRS
    # ============================================================

    wrs = min(
        round(wrs),
        100
    )

    # ============================================================
    # RISK LEVEL
    # ============================================================

    if wrs >= 80:

        level = "Critical"

    elif wrs >= 60:

        level = "High"

    elif wrs >= 40:

        level = "Medium"

    else:

        level = "Low"

    # ============================================================
    # RETURN RESULT
    # ============================================================

    return {

        "score": wrs,

        "wrs": wrs,

        "level": level,

        "components": {

            "sensor_risk": round(
                sensor_risk
            ),

            "severity": round(
                severity_component
            ),

            "impact": round(
                impact_score
            ),

            "location_impact": round(
                location_score
            ),

            "trend": round(
                trend_score
            )
        },

        # Extra information useful for
        # dashboard explanations
        "sensor_breakdown": {

            "pressure": round(
                pressure_risk
            ),

            "flow": round(
                flow_risk
            ),

            "acoustic": round(
                acoustic_risk
            ),

            "ph": round(
                ph_risk
            ),

            "tds": round(
                tds_risk
            ),

            "turbidity": round(
                turbidity_risk
            ),

            "ml_anomaly": round(
                ml_risk
            )
        },

        "impact_breakdown": {

            "population": round(
                population_score
            ),

            "facilities": round(
                facility_score
            ),

            "critical_area": round(
                critical_score
            )
        }
    }