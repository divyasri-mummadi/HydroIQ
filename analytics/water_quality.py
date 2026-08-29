def analyze_water_quality(data):
    ph = data.get("ph", 7)
    tds = data.get("tds", 0)
    turbidity = data.get("turbidity", 0)

    issues = []

    # pH check
    if ph < 6.5 or ph > 8.5:
        issues.append("Abnormal pH")

    # TDS check
    if tds > 500:
        issues.append("High TDS")

    # Turbidity check
    if turbidity > 5:
        issues.append("High turbidity")

    if issues:
        status = "Poor"
    else:
        status = "Good"

    return {
        "status": status,
        "issues": issues
    }
