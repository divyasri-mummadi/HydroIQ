def calculate_sensor_health(data):
    pressure = data.get("pressure", 0)
    flow = data.get("flow", 0)
    acoustic = data.get("acoustic", 0)
    ph = data.get("ph", 0)
    tds = data.get("tds", 0)
    turbidity = data.get("turbidity", 0)

    sensors = {}

    # Pressure
    if pressure < 0:
        sensors["pressure"] = 0
    elif pressure < 2.0 or pressure > 5.0:
        sensors["pressure"] = 70
    else:
        sensors["pressure"] = 100

    # Flow
    if flow < 0:
        sensors["flow"] = 0
    elif flow < 50 or flow > 200:
        sensors["flow"] = 70
    else:
        sensors["flow"] = 100

    # Acoustic
    if acoustic < 0:
        sensors["acoustic"] = 0
    elif acoustic > 0.75:
        sensors["acoustic"] = 70
    else:
        sensors["acoustic"] = 100

    # pH
    if ph <= 0 or ph > 14:
        sensors["ph"] = 0
    elif ph < 6.5 or ph > 8.5:
        sensors["ph"] = 70
    else:
        sensors["ph"] = 100

    # TDS
    if tds < 0:
        sensors["tds"] = 0
    elif tds > 500:
        sensors["tds"] = 70
    else:
        sensors["tds"] = 100

    # Turbidity
    if turbidity < 0:
        sensors["turbidity"] = 0
    elif turbidity > 5:
        sensors["turbidity"] = 70
    else:
        sensors["turbidity"] = 100

    overall = round(sum(sensors.values()) / len(sensors))

    if overall >= 90:
        status = "Excellent"
    elif overall >= 70:
        status = "Needs Attention"
    else:
        status = "Poor"

    return {
        "overall_score": overall,
        "status": status,
        "sensors": sensors
    }