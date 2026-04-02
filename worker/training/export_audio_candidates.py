import os
import csv
import numpy as np
import librosa


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


def export_audio_candidates(audio_path, output_csv_path, source_clip_name=None, window_ms=200, hop_ms=100):
    y, sr = librosa.load(audio_path, sr=44100, mono=True)

    if source_clip_name is None:
        source_clip_name = os.path.basename(audio_path)

    window_size = int(sr * (window_ms / 1000.0))
    hop_size = int(sr * (hop_ms / 1000.0))

    rows = []
    prev_rms = None

    for start in range(0, len(y) - window_size + 1, hop_size):
        end = start + window_size
        window = y[start:end]

        curr_rms = rms_energy(window)
        curr_peak = float(np.max(np.abs(window))) if len(window) > 0 else 0.0
        curr_zcr = zcr(window)
        rms_delta = 0.0 if prev_rms is None else curr_rms - prev_rms

        # Lower threshold so you export candidate windows, not just strongest detections
        if curr_peak > 0.35 or rms_delta > 0.03:
            rows.append({
                "source_clip": source_clip_name,
                "timestamp_start": round(start / sr, 2),
                "timestamp_end": round(end / sr, 2),
                "rms": round(curr_rms, 4),
                "peak": round(curr_peak, 4),
                "zcr": round(curr_zcr, 4),
                "rms_delta": round(rms_delta, 4),
                "label": ""
            })

        prev_rms = curr_rms

    os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
    file_exists = os.path.exists(output_csv_path)

    with open(output_csv_path, "a", newline="", encoding="utf-8") as csvfile:
        fieldnames = [
            "source_clip",
            "timestamp_start",
            "timestamp_end",
            "rms",
            "peak",
            "zcr",
            "rms_delta",
            "label"
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        if not file_exists:
            writer.writeheader()

        writer.writerows(rows)

    print(f"Appended {len(rows)} audio candidate rows to: {output_csv_path}")


if __name__ == "__main__":
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

    # CHANGE THIS each time
    sample_audio_path = os.path.join(PROJECT_ROOT, "output", "audio", "YOUR_TEST_AUDIO.wav")

    output_csv_path = os.path.join(BASE_DIR, "training", "audio_training_data.csv")

    export_audio_candidates(sample_audio_path, output_csv_path)