import json
from flash_warning_utils import process_flash_warnings, frame_to_time


def simulate_flash_detection():
    """
    Replace this with your actual CV2 detection logic
    """
    return [
        {"frame": 100, "intensity": 0.80},
        {"frame": 101, "intensity": 0.82},
        {"frame": 102, "intensity": 0.85},
        {"frame": 150, "intensity": 0.65},
        {"frame": 151, "intensity": 0.70},
        {"frame": 152, "intensity": 0.72},
        {"frame": 220, "intensity": 0.90},
        {"frame": 221, "intensity": 0.92},
        {"frame": 222, "intensity": 0.91},
        {"frame": 223, "intensity": 0.88},
        {"frame": 224, "intensity": 0.87},
        {"frame": 225, "intensity": 0.89},
    ]


def worker_process(job_id="job_001", fps=30.0):
    print("Worker started...")

    # Step 1: Get raw flash detections
    raw_events = simulate_flash_detection()

    # Step 2: Convert frame -> timestamp
    for e in raw_events:
        e["timestamp"] = frame_to_time(e["frame"], fps)

    print(f"Raw events: {len(raw_events)}")

    # Step 3: Group + Severity
    segments = process_flash_warnings(raw_events)

    print(f"Segments created: {len(segments)}")

    # Step 4: Final JSON output
    result = {
        "jobId": job_id,
        "warningType": "flash",
        "segments": segments
    }

    # Step 5: Save output
    with open("output.json", "w") as f:
        json.dump(result, f, indent=4)

    print("Processing complete. Output saved to output.json")

    # Step 6: Print summary
    for i, s in enumerate(segments, 1):
        print(f"Segment {i}: {s['start_time']}s - {s['end_time']}s | {s['severity']}")


if __name__ == "__main__":
    worker_process()