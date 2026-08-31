def classify_condition(data, leak_result, quality_result, stage=None):

    pressure = data.get("pressure", 0)
    flow = data.get("flow", 0)
    acoustic = data.get("acoustic", 0)
    ph = data.get("ph", 0)
    tds = data.get("tds", 0)
    turbidity = data.get("turbidity", 0)

    # ---------------------------------
    # SIMULATION SCENARIO OVERRIDE
    # ---------------------------------

    if stage == "SENSOR_FAULT":
        return {
            "condition": "SENSOR_FAULT",
            "severity": "HIGH",
            "reason": "The simulated sensor node is reporting a sensor fault condition."
        }

    if stage == "WATER_QUALITY":
        return {
            "condition": "WATER_QUALITY",
            "severity": "HIGH",
            "reason": "Multiple water-quality indicators show abnormal conditions."
        }

    if stage == "LEAK":
        return {
            "condition": "LEAK",
            "severity": "HIGH",
            "reason": "Multiple sensor signals indicate a possible pipeline leak."
        }

    if stage == "EARLY_ANOMALY":
        return {
            "condition": "EARLY_ANOMALY",
            "severity": "MEDIUM",
            "reason": "Sensor readings show an abnormal trend that should be monitored."
        }

    if stage == "NORMAL":
        return {
            "condition": "NORMAL",
            "severity": "LOW",
            "reason": "Sensor readings are within the expected operating range."
        }

    # ---------------------------------
    # FALLBACK SENSOR-BASED CLASSIFICATION
    # ---------------------------------

    # 1. SENSOR FAULT

    if (
        pressure <= 0
        or flow < 0
        or acoustic < 0
        or ph <= 0
        or ph > 14
        or tds < 0
        or turbidity < 0
    ):
        return {
            "condition": "SENSOR_FAULT",
            "severity": "HIGH",
            "reason": "One or more sensor readings are physically invalid."
        }

    # 2. LEAK

    leak_indicators = 0

    if pressure < 2.0:
        leak_indicators += 1

    if flow > 150:
        leak_indicators += 1

    if acoustic > 0.75:
        leak_indicators += 1

    if leak_indicators >= 2:
        return {
            "condition": "LEAK",
            "severity": "HIGH",
            "reason": "Multiple sensor signals indicate a possible pipeline leak."
        }

    # 3. WATER QUALITY

    if quality_result["status"] == "Poor":
        return {
            "condition": "WATER_QUALITY",
            "severity": "HIGH",
            "reason": "Water-quality indicators are outside the monitored safe range."
        }

    # 4. EARLY ANOMALY

    anomaly_indicators = 0

    if pressure < 2.3:
        anomaly_indicators += 1

    if flow > 130:
        anomaly_indicators += 1

    if acoustic > 0.60:
        anomaly_indicators += 1

    if turbidity > 4:
        anomaly_indicators += 1

    if ph < 6.6 or ph > 8.4:
        anomaly_indicators += 1

    if tds > 450:
        anomaly_indicators += 1

    if anomaly_indicators >= 1:
        return {
            "condition": "EARLY_ANOMALY",
            "severity": "MEDIUM",
            "reason": "Sensor readings show an abnormal trend that should be monitored."
        }

    # 5. NORMAL

    return {
        "condition": "NORMAL",
        "severity": "LOW",
        "reason": "Sensor readings are within the expected operating range."
    }