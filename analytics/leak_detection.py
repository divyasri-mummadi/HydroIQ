def detect_leak(data):
    pressure = data.get("pressure", 0)
    flow = data.get("flow", 0)
    acoustic = data.get("acoustic", 0)

    if pressure < 2.0 and flow > 100:
        return {
            "leak_detected": True,
            "confidence": 0.85,
            "reason": "Low pressure with unusually high flow"
        }

    if acoustic > 0.75:
        return {
            "leak_detected": True,
            "confidence": 0.80,
            "reason": "Unusual acoustic signal detected"
        }

    return {
        "leak_detected": False,
        "confidence": 0.90,
        "reason": "Sensor readings appear normal"
    }
