def calculate_risk_score(leak_result, quality_result):
    score = 0

    # Leak risk
    if leak_result["leak_detected"]:
        score += 50

    # Water quality risk
    if quality_result["status"] == "Poor":
        score += 40

    # Keep score between 0 and 100
    score = min(score, 100)

    if score >= 70:
        level = "High"
    elif score >= 40:
        level = "Medium"
    else:
        level = "Low"

    return {
        "score": score,
        "level": level
    }
