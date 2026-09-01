import os
import joblib
import pandas as pd


# ============================================================
# MODEL LOCATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_FILE = os.path.join(
    BASE_DIR,
    "hydroiq_ml_model.pkl"
)


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

print("Loading HydroIQ ML model...")

try:
    model = joblib.load(MODEL_FILE)
    print("HydroIQ ML model loaded successfully!")

except Exception as error:
    model = None
    print(
        f"Warning: Unable to load HydroIQ ML model: {error}"
    )


# ============================================================
# SENSOR FEATURES
# ============================================================

FEATURE_COLUMNS = [
    "pressure",
    "flow",
    "acoustic",
    "pH",
    "tds",
    "turbidity"
]


# ============================================================
# PREDICT CONDITION
# ============================================================

def predict_condition(sensor_data):
    """
    Predict network condition using the trained HydroIQ ML model.

    Expected input:

        {
            "pressure": 2.55,
            "flow": 116,
            "acoustic": 1.47,
            "ph": 7.2,
            "tds": 295,
            "turbidity": 1.94
        }

    Returns:

        {
            "prediction": "LEAK",
            "confidence": 0.94,
            "probabilities": {...}
        }
    """

    sensor_data = sensor_data or {}

    # --------------------------------------------------------
    # Make sure model exists
    # --------------------------------------------------------

    if model is None:

        return {
            "prediction": "UNKNOWN",
            "confidence": 0.0,
            "probabilities": {},
            "error": "HydroIQ ML model is not available."
        }

    # --------------------------------------------------------
    # Read sensor values
    #
    # Support both "ph" and "pH".
    # --------------------------------------------------------

    prepared_data = {
        "pressure": sensor_data.get(
            "pressure",
            0
        ),

        "flow": sensor_data.get(
            "flow",
            0
        ),

        "acoustic": sensor_data.get(
            "acoustic",
            0
        ),

        "pH": sensor_data.get(
            "pH",
            sensor_data.get("ph", 0)
        ),

        "tds": sensor_data.get(
            "tds",
            0
        ),

        "turbidity": sensor_data.get(
            "turbidity",
            0
        )
    }

    # --------------------------------------------------------
    # Convert values to numeric
    # --------------------------------------------------------

    for key in prepared_data:

        try:

            prepared_data[key] = float(
                prepared_data[key]
            )

        except (
            TypeError,
            ValueError
        ):

            prepared_data[key] = 0.0

    # --------------------------------------------------------
    # DataFrame
    # --------------------------------------------------------

    input_data = pd.DataFrame(
        [prepared_data],
        columns=FEATURE_COLUMNS
    )

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    try:

        prediction = model.predict(
            input_data
        )[0]

        prediction = str(
            prediction
        ).upper()

    except Exception as error:

        return {
            "prediction": "UNKNOWN",
            "confidence": 0.0,
            "probabilities": {},
            "error": f"Prediction failed: {error}"
        }

    # --------------------------------------------------------
    # Confidence
    # --------------------------------------------------------

    confidence = 0.0
    probabilities_dict = {}

    try:

        probabilities = model.predict_proba(
            input_data
        )[0]

        confidence = float(
            max(probabilities)
        )

        probabilities_dict = {
            str(class_name).upper(): round(
                float(probability),
                4
            )
            for class_name, probability
            in zip(
                model.classes_,
                probabilities
            )
        }

    except Exception:

        # Some models do not provide predict_proba.
        confidence = 0.0

    # --------------------------------------------------------
    # Result
    # --------------------------------------------------------

    return {

        "prediction": prediction,

        "confidence": round(
            confidence,
            4
        ),

        "confidence_percent": round(
            confidence * 100,
            2
        ),

        "probabilities": probabilities_dict

    }


# ============================================================
# BACKWARD-COMPATIBLE ALIAS
# ============================================================

def predict_ml(sensor_data):
    """
    Alias for compatibility with existing backend code.
    """

    return predict_condition(
        sensor_data
    )


# ============================================================
# OPTIONAL COMMAND-LINE TEST
# ============================================================

if __name__ == "__main__":

    test_sensor_data = {

        "pressure": 1.92,

        "flow": 151,

        "acoustic": 1.41,

        "ph": 7.20,

        "tds": 315,

        "turbidity": 2.10

    }

    result = predict_condition(
        test_sensor_data
    )

    print()
    print("==============================")
    print("HYDROIQ ML PREDICTION")
    print("==============================")

    print(
        f"Prediction : "
        f"{result.get('prediction')}"
    )

    print(
        f"Confidence : "
        f"{result.get('confidence_percent', 0):.2f}%"
    )

    print()
    print("Class probabilities:")

    for class_name, probability in result.get(
        "probabilities",
        {}
    ).items():

        print(
            f"{class_name:15} : "
            f"{probability * 100:.2f}%"
        )