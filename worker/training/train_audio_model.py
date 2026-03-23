import pandas as pd
import joblib
import os

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


def train_audio_model(csv_path, output_model_path):
    df = pd.read_csv(csv_path)

    feature_cols = [
        "rms",
        "peak",
        "zcr",
        "rms_delta"
    ]

    X = df[feature_cols]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))

    os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
    joblib.dump(model, output_model_path)
    print(f"Audio model saved to: {output_model_path}")


import os

if __name__ == "__main__":
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    csv_path = os.path.join(BASE_DIR, "training", "audio_training_data.csv")
    output_model_path = os.path.join(BASE_DIR, "models", "audio_model.joblib")

    train_audio_model(
        csv_path=csv_path,
        output_model_path=output_model_path
    )