# from flash_warning_utils import process_flash_warnings, frame_to_time


# def main():
#     fps = 30.0

#     raw_events = [
#         {"frame": 100, "intensity": 0.80},
#         {"frame": 101, "intensity": 0.82},
#         {"frame": 102, "intensity": 0.85},
#         {"frame": 150, "intensity": 0.65},
#         {"frame": 151, "intensity": 0.70},
#         {"frame": 152, "intensity": 0.72},
#         {"frame": 220, "intensity": 0.90},
#         {"frame": 221, "intensity": 0.92},
#         {"frame": 222, "intensity": 0.91},
#         {"frame": 223, "intensity": 0.88},
#         {"frame": 224, "intensity": 0.87},
#         {"frame": 225, "intensity": 0.89},
#     ]

#     # Convert frame to timestamp
#     for e in raw_events:
#         e["timestamp"] = frame_to_time(e["frame"], fps)

#     segments = process_flash_warnings(raw_events)

#     print("\nRESULT:\n")

#     for i, seg in enumerate(segments, 1):
#         print(f"Segment {i}")
#         print(seg)
#         print("-" * 50)


# if __name__ == "__main__":
#     main()