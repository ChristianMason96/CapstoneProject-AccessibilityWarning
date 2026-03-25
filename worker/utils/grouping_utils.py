def group_flash_events(flash_events, max_gap_seconds=0.5):

    # Group  nearby flash events for warning segments
    # input should have: timestamp_start, timestamp_end, confidence, severity, detection_mode

    if not flash_events:
        return []

    # Keep events in order by time
    flash_events = sorted(flash_events, key=lambda e: e["timestamp_start"])

    grouped = []
    current_group = {
        "warning_type": "flash",
        "start_time": flash_events[0]["timestamp_start"],
        "end_time": flash_events[0]["timestamp_end"],
        "confidence_values": [flash_events[0]["confidence"]],
        "severity_values": [flash_events[0]["severity"]],
        "detection_mode": flash_events[0].get("detection_mode", "unknown"),
        "event_count": 1
    }

    for event in flash_events[1:]:
        gap = event["timestamp_start"] - current_group["end_time"]

        if gap <= max_gap_seconds:
            current_group["end_time"] = max(current_group["end_time"], event["timestamp_end"])
            current_group["confidence_values"].append(event["confidence"])
            current_group["severity_values"].append(event["severity"])
            current_group["event_count"] += 1
        else:
            grouped.append(_finalize_group(current_group))
            current_group = {
                "warning_type": "flash",
                "start_time": event["timestamp_start"],
                "end_time": event["timestamp_end"],
                "confidence_values": [event["confidence"]],
                "severity_values": [event["severity"]],
                "detection_mode": event.get("detection_mode", "unknown"),
                "event_count": 1
            }

    grouped.append(_finalize_group(current_group))
    return grouped


def group_audio_events(audio_events, max_gap_seconds=0.3):

    # Group  nearby audio spikes for warning segments
    # input should have: timestamp_start, timestamp_end, confidence, severity, detection_mode

    if not audio_events:
        return []

    audio_events = sorted(audio_events, key=lambda e: e["timestamp_start"])

    grouped = []
    current_group = {
        "warning_type": "audio_spike",
        "start_time": audio_events[0]["timestamp_start"],
        "end_time": audio_events[0]["timestamp_end"],
        "confidence_values": [audio_events[0]["confidence"]],
        "severity_values": [audio_events[0]["severity"]],
        "detection_mode": audio_events[0].get("detection_mode", "unknown"),
        "event_count": 1
    }

    for event in audio_events[1:]:
        gap = event["timestamp_start"] - current_group["end_time"]

        if gap <= max_gap_seconds:
            current_group["end_time"] = max(current_group["end_time"], event["timestamp_end"])
            current_group["confidence_values"].append(event["confidence"])
            current_group["severity_values"].append(event["severity"])
            current_group["event_count"] += 1
        else:
            grouped.append(_finalize_group(current_group))
            current_group = {
                "warning_type": "audio_spike",
                "start_time": event["timestamp_start"],
                "end_time": event["timestamp_end"],
                "confidence_values": [event["confidence"]],
                "severity_values": [event["severity"]],
                "detection_mode": event.get("detection_mode", "unknown"),
                "event_count": 1
            }

    grouped.append(_finalize_group(current_group))
    return grouped


def _finalize_group(group):
    avg_confidence = sum(group["confidence_values"]) / len(group["confidence_values"])
    final_severity = _highest_severity(group["severity_values"])

    return {
        "warning_type": group["warning_type"],
        "start_time": round(group["start_time"], 2),
        "end_time": round(group["end_time"], 2),
        "confidence": round(avg_confidence, 3),
        "severity": final_severity,
        "detection_mode": group["detection_mode"],
        "event_count": group["event_count"]
    }


def _highest_severity(severity_list):
    if "high" in severity_list:
        return "high"
    if "medium" in severity_list:
        return "medium"
    return "low"