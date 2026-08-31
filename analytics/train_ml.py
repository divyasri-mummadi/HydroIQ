import os
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib


# ==========================================
# FILE PATH
# ==========================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_FILE = os.path.join(BASE_DIR, "ml_dataset.csv")
MODEL_FILE = os.path.join(BASE_DIR, "hydroiq_ml_model.pkl")


# ==========================================
# LOAD DATASET
# ==========================================

print("Loading HydroIQ dataset...")

df = pd.read_csv(DATASET_FILE)

print(f"Total samples: {len(df)}")


# ==========================================
# SENSOR FEATURES
# ==========================================

features = [
    "pressure",
    "flow",
    "acoustic",
    "pH",
    "tds",
    "turbidity",
]

X = df[features]
y = df["stage"]


# ==========================================
# SHOW CLASS DISTRIBUTION
# ==========================================

print("\nClass distribution:")
print(y.value_counts())


# ==========================================
# TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# CREATE ML MODEL
# ==========================================

print("\nTraining Random Forest model...")

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)


# ==========================================
# TRAIN
# ==========================================

model.fit(X_train, y_train)


# ==========================================
# PREDICTION
# ==========================================

y_pred = model.predict(X_test)


# ==========================================
# ACCURACY
# ==========================================

accuracy = accuracy_score(y_test, y_pred)

print("\n==============================")
print("HYDROIQ ML RESULTS")
print("==============================")

print(f"\nAccuracy: {accuracy * 100:.2f}%")


# ==========================================
# CLASSIFICATION REPORT
# ==========================================

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ==========================================
# CONFUSION MATRIX
# ==========================================

print("\nConfusion Matrix:")

labels = model.classes_

cm = confusion_matrix(
    y_test,
    y_pred,
    labels=labels
)

print("Labels:", list(labels))
print(cm)


# ==========================================
# FEATURE IMPORTANCE
# ==========================================

print("\nFeature Importance:")

importance = pd.Series(
    model.feature_importances_,
    index=features
).sort_values(ascending=False)

print(importance)


# ==========================================
# SAVE MODEL
# ==========================================

joblib.dump(model, MODEL_FILE)

print("\nModel saved successfully!")
print(f"Location: {MODEL_FILE}")