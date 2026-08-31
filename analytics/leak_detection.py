def detect_leak(data):
    pressure = data.get("pressure", 0)
    flow = data.get("flow", 0)
    acoustic = data.get("acoustic", 0)

    indicators = []

    # Pressure drop
    if pressure < 2.0:
        indicators.append("Low pressure")

    # Unusually high flow
    if flow > 150:
        indicators.append("High flow")

    # Elevated acoustic signal
    if acoustic > 0.75:
        indicators.append("Elevated acoustic signal")

    # Multiple signals agree → likely leak
    if len(indicators) >= 2:
        confidence = min(0.70 + (len(indicators) * 0.10), 0.95)

        return {
            "leak_detected": True,
            "confidence": confidence,
            "reason": "Multiple leak indicators detected: " + ", ".join(indicators)
        }

    # One abnormal signal → don't call it a leak yet
    if len(indicators) == 1:
        return {
            "leak_detected": False,
            "confidence": 0.60,
            "reason": "Single abnormal signal detected: " + indicators[0]
        }

    # Everything normal
    return {
        "leak_detected": False,
        "confidence": 0.90,
        "reason": "Pressure, flow and acoustic readings appear normal"
    }
