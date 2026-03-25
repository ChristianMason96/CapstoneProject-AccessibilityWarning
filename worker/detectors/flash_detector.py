import cv2
import numpy as np
import joblib
import os

def load_flash_model(model_path):
    if not os.path.exists(model_path):
        return None

    try:
        return joblib.load(model_path)
    except Exception as e:
        print(f"Warning: could not load flash model at {model_path}: {repr(e)}")
        print("Falling back to baseline flash detection.")
        return None

def compute_flash_features(prev_frame, curr_frame):
    prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
    curr_gray = cv2.cvtColor(curr_frame, cv2.COLOR_BGR2GRAY)

    prev_brightness = float(np.mean(prev_gray))
    curr_brightness = float(np.mean(curr_gray))
    brightness_diff = curr_brightness - prev_brightness

    abs_diff = cv2.absdiff(curr_gray, prev_gray)
    changed_pixels_ratio = float(np.mean(abs_diff > 30))

    std_curr = float(np.std(curr_gray))

    return {
        "prev_brightness": prev_brightness,
        "curr_brightness": curr_brightness,
        "brightness_diff": brightness_diff,
        "changed_pixels_ratio": changed_pixels_ratio,
        "std_curr": std_curr
    }


def feature_dict_to_vector(feature_dict):
    return [[
        feature_dict["prev_brightness"],
        feature_dict["curr_brightness"],
        feature_dict["brightness_diff"],
        feature_dict["changed_pixels_ratio"],
        feature_dict["std_curr"]
    ]]


def severity_from_score(confidence):
    if confidence >= 0.85:
        return "high"
    if confidence >= 0.60:
        return "medium"
    return "low"


def baseline_flash_decision(features, brightness_threshold=40, changed_ratio_threshold=0.25):
    is_flash = (
        features["brightness_diff"] > brightness_threshold and
        features["changed_pixels_ratio"] > changed_ratio_threshold
    )

    confidence = min(
        0.95,
        max(
            0.30,
            (
                (features["brightness_diff"] / 80.0) * 0.6 +
                (features["changed_pixels_ratio"]) * 0.4
            )
        )
    )

    return is_flash, float(confidence)


def detect_flash_events(video_path, model_path, min_gap_seconds=0.3):
    model = load_flash_model(model_path)

    print("Inside detect_flash_events")
    print("Video path:", video_path)
    print("Model path:", model_path)
    print("Model exists:", os.path.exists(model_path))
    print("Using ML model:", model is not None)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        cap.release()
        raise ValueError("Could not read FPS from video.")

    flash_events = []
    prev_frame = None
    frame_index = 0
    last_flash_time = -min_gap_seconds

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if prev_frame is not None:
            features = compute_flash_features(prev_frame, frame)
            X = feature_dict_to_vector(features)

            if model is not None:
                prediction = model.predict(X)[0]
                if hasattr(model, "predict_proba"):
                    confidence = float(model.predict_proba(X)[0][1])
                else:
                    confidence = 1.0 if prediction == 1 else 0.0
                is_flash = prediction == 1
                detection_mode = "ml_model"
            else:
                is_flash, confidence = baseline_flash_decision(features)
                detection_mode = "baseline_rule"

            current_time = frame_index / fps

            if is_flash and (current_time - last_flash_time >= min_gap_seconds):
                flash_events.append({
                    "type": "flash",
                    "frame": frame_index,
                    "timestamp_start": round(current_time, 2),
                    "timestamp_end": round(current_time + (1.0 / fps), 2),
                    "confidence": round(confidence, 3),
                    "severity": severity_from_score(confidence),
                    "detection_mode": detection_mode,
                    "features": {
                        "brightness_diff": round(features["brightness_diff"], 2),
                        "changed_pixels_ratio": round(features["changed_pixels_ratio"], 3),
                        "prev_brightness": round(features["prev_brightness"], 2),
                        "curr_brightness": round(features["curr_brightness"], 2),
                        "std_curr": round(features["std_curr"], 2)
                    }
                })
                last_flash_time = current_time

        prev_frame = frame.copy()
        frame_index += 1

    cap.release()
    return flash_events