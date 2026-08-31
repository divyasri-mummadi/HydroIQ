def calculate_risk_score(
    sensor_data,
    leak_result,
    quality_result
):
    """
    HydroIQ Water Risk Score

    Risk is generated from actual sensor abnormalities,
    leak evidence and water-quality problems.

    Location is NOT considered here.
    Location is handled later by priority.py.
    """

    # ============================================================
    # SENSOR VALUES
    # ============================================================

    pressure = float(sensor_data.get("pressure", 0) or 0)
    flow = float(sensor_data.get("flow", 0) or 0)
    acoustic = float(sensor_data.get("acoustic", 0) or 0)

    ph = float(sensor_data.get("ph", 7.0) or 7.0)
    tds = float(sensor_data.get("tds", 0) or 0)
    turbidity = float(sensor_data.get("turbidity", 0) or 0)


    # ============================================================
    # INDIVIDUAL SENSOR RISK
    # ============================================================

    pressure_risk = 0
    flow_risk = 0
    acoustic_risk = 0
    ph_risk = 0
    tds_risk = 0
    turbidity_risk = 0


    # ------------------------------------------------------------
    # PRESSURE
    # Normal: approximately 2.0 - 4.0 bar
    # ------------------------------------------------------------

    if pressure < 1.5 or pressure > 4.5:

        pressure_risk = 25

    elif pressure < 2.0 or pressure > 4.0:

        pressure_risk = 10


    # ------------------------------------------------------------
    # FLOW
    # Normal: approximately 80 - 160 L/min
    # ------------------------------------------------------------

    if flow < 60 or flow > 180:

        flow_risk = 25

    elif flow < 80 or flow > 160:

        flow_risk = 10


    # ------------------------------------------------------------
    # ACOUSTIC
    #
    # Your current normal readings are around:
    # 0.3 - 0.6
    #
    # An elevated acoustic reading around 1.0+ is treated
    # as an early anomaly.
    # ------------------------------------------------------------

    if acoustic >= 2.5:

        acoustic_risk = 30

    elif acoustic >= 1.5:

        acoustic_risk = 20

    elif acoustic >= 1.0:

        acoustic_risk = 12

    elif acoustic >= 0.8:

        acoustic_risk = 8


    # ------------------------------------------------------------
    # pH
    # ------------------------------------------------------------

    if ph < 6.0 or ph > 9.0:

        ph_risk = 25

    elif ph < 6.5 or ph > 8.5:

        ph_risk = 15

    elif ph < 6.8 or ph > 8.2:

        ph_risk = 8


    # ------------------------------------------------------------
    # TDS
    # ------------------------------------------------------------

    if tds > 600:

        tds_risk = 25

    elif tds > 500:

        tds_risk = 15

    elif tds > 400:

        tds_risk = 8


    # ------------------------------------------------------------
    # TURBIDITY
    # ------------------------------------------------------------

    if turbidity > 5:

        turbidity_risk = 25

    elif turbidity > 3:

        turbidity_risk = 15

    elif turbidity > 2.5:

        turbidity_risk = 8


    # ============================================================
    # LEAK RISK
    # ============================================================

    leak_risk = 0

    if leak_result.get(
        "leak_detected",
        False
    ):

        # Confirmed leak is a major network risk
        leak_risk = 70


    # ============================================================
    # WATER QUALITY RISK
    # ============================================================

    water_quality_risk = 0

    quality_status = quality_result.get(
        "status",
        "Good"
    )

    if quality_status == "Poor":

        water_quality_risk = 40

    elif quality_status == "Fair":

        water_quality_risk = 15


    # ============================================================
    # MULTI-SENSOR CORRELATION
    # ============================================================

    sensor_risks = [

        pressure_risk,
        flow_risk,
        acoustic_risk,
        ph_risk,
        tds_risk,
        turbidity_risk

    ]

    abnormal_sensor_count = sum(
        1
        for value in sensor_risks
        if value > 0
    )


    multi_sensor_leak = 0

    if abnormal_sensor_count >= 3:

        multi_sensor_leak = 20

    elif abnormal_sensor_count == 2:

        multi_sensor_leak = 10


    # ============================================================
    # SENSOR RISK
    # ============================================================

    sensor_risk = sum(
        sensor_risks
    )


    # ============================================================
    # FINAL WRS
    # ============================================================

    score = (

        sensor_risk
        + leak_risk
        + water_quality_risk
        + multi_sensor_leak

    )


    # Keep between 0 and 100

    score = min(
        round(score),
        100
    )


    # ============================================================
    # RISK LEVEL
    # ============================================================

    if score >= 70:

        level = "High"

    elif score >= 40:

        level = "Medium"

    else:

        level = "Low"


    # ============================================================
    # RETURN
    # ============================================================

    return {

        "score": score,

        "level": level,

        "components": {

            "pressure": pressure_risk,
            "flow": flow_risk,
            "acoustic": acoustic_risk,
            "ph": ph_risk,
            "tds": tds_risk,
            "turbidity": turbidity_risk,

            "leak": leak_risk,
            "water_quality": water_quality_risk,
            "multi_sensor_leak": multi_sensor_leak

        }

    }