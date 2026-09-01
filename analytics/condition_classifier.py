def classify_condition(data, leak_result, quality_result, stage=None):
    """
    Classifies the current HydroIQ network condition.

    Priority:
        1. Simulation override
        2. Sensor fault
        3. Confirmed leak
        4. Water quality problem
        5. Early anomaly
        6. Normal

    Returns:
        {
            "condition": "...",
            "severity": "...",
            "reason": "...",
            "confidence": float,
            "indicators": [...]
        }
    """

    data = data or {}
    leak_result = leak_result or {}
    quality_result = quality_result or {}

    pressure = data.get("pressure", 0)
    flow = data.get("flow", 0)
    acoustic = data.get("acoustic", 0)
    ph = data.get("ph", 0)
    tds = data.get("tds", 0)
    turbidity = data.get("turbidity", 0)

    # ============================================================
    # 1. SIMULATION SCENARIO OVERRIDES
    # ============================================================

    simulation_results = {
        "SENSOR_FAULT": {
            "condition": "SENSOR_FAULT",
            "severity": "HIGH",
            "confidence": 0.99,
            "reason": "The simulated sensor node is reporting a sensor fault condition.",
            "indicators": ["Simulated sensor fault"]
        },

        "WATER_QUALITY": {
            "condition": "WATER_QUALITY",
            "severity": "HIGH",
            "confidence": 0.99,
            "reason": "Multiple water-quality indicators show abnormal conditions.",
            "indicators": ["Simulated water-quality incident"]
        },

        "LEAK": {
            "condition": "LEAK",
            "severity": "HIGH",
            "confidence": 0.99,
            "reason": "Multiple sensor signals indicate a possible pipeline leak.",
            "indicators": [
                "Simulated pressure drop",
                "Abnormal acoustic behaviour",
                "Abnormal flow behaviour"
            ]
        },

        "EARLY_ANOMALY": {
            "condition": "EARLY_ANOMALY",
            "severity": "MEDIUM",
            "confidence": 0.90,
            "reason": "Sensor readings show an abnormal trend that should be monitored.",
            "indicators": ["Simulated abnormal trend"]
        },

        "NORMAL": {
            "condition": "NORMAL",
            "severity": "LOW",
            "confidence": 0.95,
            "reason": "Sensor readings are within the expected operating range.",
            "indicators": []
        }
    }

    if stage in simulation_results:
        return simulation_results[stage]

    # ============================================================
    # 2. SENSOR FAULT DETECTION
    # ============================================================

    invalid_readings = []

    if pressure <= 0:
        invalid_readings.append("Invalid pressure")

    if flow < 0:
        invalid_readings.append("Invalid flow")

    if acoustic < 0:
        invalid_readings.append("Invalid acoustic reading")

    if ph <= 0 or ph > 14:
        invalid_readings.append("Invalid pH")

    if tds < 0:
        invalid_readings.append("Invalid TDS")

    if turbidity < 0:
        invalid_readings.append("Invalid turbidity")

    if invalid_readings:
        return {
            "condition": "SENSOR_FAULT",
            "severity": "HIGH",
            "confidence": 0.98,
            "reason": "One or more sensor readings are physically invalid.",
            "indicators": invalid_readings
        }

    # ============================================================
    # 3. LEAK DETECTION
    # ============================================================

    leak_indicators = []

    if pressure < 2.0:
        leak_indicators.append("Low pipeline pressure")

    if flow > 150:
        leak_indicators.append("Abnormally high flow")

    if acoustic > 0.75:
        leak_indicators.append("Elevated acoustic signal")

    # If the dedicated leak detector already confirmed a leak,
    # trust that result.
    leak_detected = leak_result.get("leak_detected", False)

    if leak_detected:
        leak_reason = leak_result.get(
            "reason",
            "The leak detection engine identified multiple abnormal sensor signals."
        )

        return {
            "condition": "LEAK",
            "severity": "HIGH",
            "confidence": 0.95,
            "reason": leak_reason,
            "indicators": leak_indicators or ["Leak detection engine confirmation"]
        }

    # Sensor-based confirmation requires multiple signals.
    if len(leak_indicators) >= 2:
        return {
            "condition": "LEAK",
            "severity": "HIGH",
            "confidence": min(0.95, 0.70 + (0.10 * len(leak_indicators))),
            "reason": "Multiple sensor signals indicate a possible pipeline leak.",
            "indicators": leak_indicators
        }

    # ============================================================
    # 4. WATER QUALITY
    # ============================================================

    quality_status = quality_result.get("status", "")

    quality_issues = quality_result.get("issues", [])

    if not isinstance(quality_issues, list):
        quality_issues = []

    if quality_status == "Poor" or len(quality_issues) > 0:
        indicators = quality_issues.copy()

        if not indicators:
            indicators.append(
                "Water-quality indicators are outside the monitored safe range."
            )

        return {
            "condition": "WATER_QUALITY",
            "severity": "HIGH",
            "confidence": 0.92,
            "reason": "Water-quality indicators are outside the monitored safe range.",
            "indicators": indicators
        }

    # ============================================================
    # 5. EARLY ANOMALY DETECTION
    # ============================================================

    anomaly_indicators = []

    if pressure < 2.3:
        anomaly_indicators.append("Pressure below normal range")

    if flow > 130:
        anomaly_indicators.append("Flow above normal range")

    if acoustic > 0.60:
        anomaly_indicators.append("Acoustic signal elevated")

    if turbidity > 4:
        anomaly_indicators.append("Turbidity elevated")

    if ph < 6.6 or ph > 8.4:
        anomaly_indicators.append("pH outside preferred range")

    if tds > 450:
        anomaly_indicators.append("TDS approaching abnormal range")

    # Require at least two indicators for an early anomaly.
    # This prevents a single noisy sensor from triggering an alert.
    if len(anomaly_indicators) >= 2:
        return {
            "condition": "EARLY_ANOMALY",
            "severity": "MEDIUM",
            "confidence": min(0.90, 0.55 + (0.08 * len(anomaly_indicators))),
            "reason": "Multiple sensor readings show an abnormal trend that should be monitored.",
            "indicators": anomaly_indicators
        }

    # ============================================================
    # 6. NORMAL
    # ============================================================

    return {
        "condition": "NORMAL",
        "severity": "LOW",
        "confidence": 0.95,
        "reason": "Sensor readings are within the expected operating range.",
        "indicators": []
    }