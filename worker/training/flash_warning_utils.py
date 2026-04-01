# from typing import List, Dict, Any


# def build_segment(events: List[Dict[str, Any]]) -> Dict[str, Any]:
#     start_time = events[0]["timestamp"]
#     end_time = events[-1]["timestamp"]
#     duration = end_time - start_time

#     intensities = [float(e.get("intensity", 0)) for e in events]

#     return {
#         "start_time": round(start_time, 2),
#         "end_time": round(end_time, 2),
#         "duration": round(duration, 2),
#         "flash_count": len(events),
#         "max_intensity": round(max(intensities), 2),
#         "avg_intensity": round(sum(intensities) / len(intensities), 2),
#         "events": events
#     }


# def group_flash_events(events: List[Dict[str, Any]], gap_threshold: float = 0.5):
#     if not events:
#         return []

#     events = sorted(events, key=lambda x: x["timestamp"])
#     segments = []
#     current = [events[0]]

#     for i in range(1, len(events)):
#         prev = events[i - 1]
#         curr = events[i]

#         gap = curr["timestamp"] - prev["timestamp"]

#         if gap <= gap_threshold:
#             current.append(curr)
#         else:
#             segments.append(build_segment(current))
#             current = [curr]

#     segments.append(build_segment(current))
#     return segments


# def assign_flash_severity(segment: Dict[str, Any]):
#     score = 0

#     if segment["max_intensity"] >= 0.85:
#         score += 2
#     elif segment["max_intensity"] >= 0.7:
#         score += 1

#     if segment["flash_count"] >= 6:
#         score += 2
#     elif segment["flash_count"] >= 3:
#         score += 1

#     if segment["duration"] >= 1.5:
#         score += 2
#     elif segment["duration"] >= 0.5:
#         score += 1

#     if score <= 2:
#         severity = "Low"
#     elif score <= 4:
#         severity = "Medium"
#     else:
#         severity = "High"

#     segment["severity_score"] = score
#     segment["severity"] = severity

#     return segment


# def process_flash_warnings(events):
#     segments = group_flash_events(events)
#     return [assign_flash_severity(s) for s in segments]


# def frame_to_time(frame, fps):
#     return round(frame / fps, 2)