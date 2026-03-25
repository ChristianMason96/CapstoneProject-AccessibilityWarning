import os
import joblib
import numpy as np
import librosa

def load_audio_model(model_path):
    if not os.path.exists(model_path):
        return None

    try:
        return joblib.load(model_path)
    except Exception as e:
        print(f"Warning: could not load audio model at {model_path}: {repr(e)}")
        print("Falling back to baseline audio detection.")
        return None

def rms_energy(window):
    return float(np.sqrt(np.mean(window ** 2))) if len(window) > 0 else 0.0


def zcr(window):
    if len(window) == 0:
        return 0.0
    return float(
        librosa.feature.zero_crossing_rate(
            y=window,
            frame_length=len(window),
            hop_length=len(window)
        )[0][0]
    )


def severity_from_score(confidence):
    if confidence >= 0.85:
        return "high"
    if confidence >= 0.60:
        return "medium"
    return "low"


def baseline_audio_decision(curr_rms, curr_peak, rms_delta):
    is_spike = (curr_peak > 0.65 and rms_delta > 0.03) or (curr_rms > 0.12 and rms_delta > 0.04)

    confidence = min(
        0.95,
        max(
            0.30,
            (curr_peak * 0.5) + (max(rms_delta, 0) * 4.0)
        )
    )

    return is_spike, float(confidence)


def detect_audio_spikes(audio_path, model_path, window_ms=200, hop_ms=100):
    model = load_audio_model(model_path)

    y, sr = librosa.load(audio_path, sr=44100, mono=True)

    window_size = int(sr * (window_ms / 1000.0))
    hop_size = int(sr * (hop_ms / 1000.0))

    events = []
    prev_rms = None

    for start in range(0, len(y) - window_size + 1, hop_size):
        end = start + window_size
        window = y[start:end]

        curr_rms = rms_energy(window)
        curr_peak = float(np.max(np.abs(window))) if len(window) > 0 else 0.0
        curr_zcr = zcr(window)

        rms_delta = 0.0 if prev_rms is None else curr_rms - prev_rms

        if model is not None:
            X = [[curr_rms, curr_peak, curr_zcr, rms_delta]]
            prediction = model.predict(X)[0]

            if hasattr(model, "predict_proba"):
                confidence = float(model.predict_proba(X)[0][1])
            else:
                confidence = 1.0 if prediction == 1 else 0.0

            is_spike = prediction == 1
            detection_mode = "ml_model"
        else:
            is_spike, confidence = baseline_audio_decision(curr_rms, curr_peak, rms_delta)
            detection_mode = "baseline_rule"

        if is_spike:
            timestamp_start = start / sr
            timestamp_end = end / sr

            events.append({
                "type": "audio_spike",
                "timestamp_start": round(timestamp_start, 2),
                "timestamp_end": round(timestamp_end, 2),
                "confidence": round(confidence, 3),
                "severity": severity_from_score(confidence),
                "detection_mode": detection_mode,
                "features": {
                    "rms": round(curr_rms, 4),
                    "peak": round(curr_peak, 4),
                    "zcr": round(curr_zcr, 4),
                    "rms_delta": round(rms_delta, 4)
                }
            })

        prev_rms = curr_rms

    return events