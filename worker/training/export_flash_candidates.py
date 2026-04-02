import os
import csv
import cv2
import numpy as np


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


def export_flash_candidates(video_path, output_csv_path, source_clip_name=None, brightness_threshold=20):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        cap.release()
        raise ValueError("Could not read FPS from video.")

    if source_clip_name is None:
        source_clip_name = os.path.basename(video_path)

    rows = []
    prev_frame = None
    frame_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if prev_frame is not None:
            features = compute_flash_features(prev_frame, frame)


            if features["brightness_diff"] > brightness_threshold:
                rows.append({
                    "source_clip": source_clip_name,
                    "frame": frame_index,
                    "timestamp": round(frame_index / fps, 2),
                    "prev_brightness": round(features["prev_brightness"], 2),
                    "curr_brightness": round(features["curr_brightness"], 2),
                    "brightness_diff": round(features["brightness_diff"], 2),
                    "changed_pixels_ratio": round(features["changed_pixels_ratio"], 3),
                    "std_curr": round(features["std_curr"], 2),
                    "label": ""
                })

        prev_frame = frame.copy()
        frame_index += 1

    cap.release()

    os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)

    file_exists = os.path.exists(output_csv_path)

    with open(output_csv_path, "a", newline="", encoding="utf-8") as csvfile:
        fieldnames = [
            "source_clip",
            "frame",
            "timestamp",
            "prev_brightness",
            "curr_brightness",
            "brightness_diff",
            "changed_pixels_ratio",
            "std_curr",
            "label"
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        if not file_exists:
            writer.writeheader()

        writer.writerows(rows)

    print(f"Appended {len(rows)} flash candidate rows to: {output_csv_path}")


if __name__ == "__main__":
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

    # CHANGE THIS filename each time you want to export a different clip
    sample_video_path = os.path.join(PROJECT_ROOT, "uploads", "ClimaxTrailer.mp4")

    output_csv_path = os.path.join(BASE_DIR, "training", "flash_training_data.csv")

    export_flash_candidates(sample_video_path, output_csv_path)