import os
import joblib
import pandas as pd


# ==========================================
# MODEL LOCATION
# ==========================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_FILE = os.path.join(
    BASE_DIR,
    "hydroiq_ml_model.pkl"
)


# ==========================================
# LOAD TRAINED MODEL
# ==========================================

print("Loading HydroIQ ML model...")

model = joblib.load(MODEL_FILE)

print("Model loaded successfully!")


# ==========================================
# NEW SENSOR READING
# ==========================================

sensor_data = {
    "pressure": 1.92,
    "flow": 151,
    "acoustic": 1.41,
    "pH": 7.20,
    "tds": 315,
    "turbidity": 2.10
}


# ==========================================
# CONVERT TO DATAFRAME
# ==========================================

input_data = pd.DataFrame(
    [sensor_data],
    columns=[
        "pressure",
        "flow",
        "acoustic",
        "pH",
        "tds",
        "turbidity"
    ]
)


# ==========================================
# PREDICTION
# ==========================================

prediction = model.predict(input_data)[0]


# ==========================================
# CONFIDENCE
# ==========================================

probabilities = model.predict_proba(input_data)[0]

confidence = max(probabilities)


# ==========================================
# SHOW RESULT
# ==========================================

print()
print("==============================")
print("HYDROIQ ML PREDICTION")
print("==============================")

print(f"Prediction : {prediction}")
print(f"Confidence : {confidence * 100:.2f}%")

print()
print("Class probabilities:")

for class_name, probability in zip(
    model.classes_,
    probabilities
):
    print(
        f"{class_name:15} : "
        f"{probability * 100:.2f}%"
    )