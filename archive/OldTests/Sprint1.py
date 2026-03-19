import cv2
import numpy as np
from moviepy import VideoFileClip

# ------------------------------
# FLASH DETECTION
# ------------------------------
def detect_flashes(video_path, flash_threshold=40):
    cap = cv2.VideoCapture(video_path)

    prev_brightness = None
    frame_number = 0
    fps = cap.get(cv2.CAP_PROP_FPS)
    flash_events = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_number += 1

        # Convert frame to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Average brightness of current frame
        curr_brightness = np.mean(gray)

        if prev_brightness is not None:
            brightness_change = curr_brightness - prev_brightness

            if brightness_change > flash_threshold:
                timestamp = frame_number / fps
                flash_events.append({
                    "frame": frame_number,
                    "time_sec": round(timestamp, 2),
                    "brightness_change": round(float(brightness_change), 2)
                })

        prev_brightness = curr_brightness

    cap.release()
    return flash_events


# ------------------------------
# AUDIO SPIKE DETECTION
# ------------------------------
def detect_audio_spikes(video_path, window_ms=100, audio_threshold=0.15):
    clip = VideoFileClip(video_path)
    audio = clip.audio

    if audio is None:
        return []

    # Convert audio to numpy array
    audio_array = audio.to_soundarray(fps=44100)

    # Convert stereo to mono if needed
    if len(audio_array.shape) > 1:
        audio_array = np.mean(audio_array, axis=1)

    sample_rate = 44100
    window_size = int(sample_rate * (window_ms / 1000))
    spike_events = []

    prev_loudness = None
    window_index = 0

    for start in range(0, len(audio_array), window_size):
        end = start + window_size
        window = audio_array[start:end]

        if len(window) == 0:
            continue

        # RMS loudness
        curr_loudness = np.sqrt(np.mean(window ** 2))
        window_index += 1

        if prev_loudness is not None:
            loudness_change = curr_loudness - prev_loudness

            if loudness_change > audio_threshold:
                timestamp = start / sample_rate
                spike_events.append({
                    "window": window_index,
                    "time_sec": round(timestamp, 2),
                    "loudness_change": round(float(loudness_change), 4)
                })

        prev_loudness = curr_loudness

    clip.close()
    return spike_events


# ------------------------------
# MAIN
# ------------------------------
if __name__ == "__main__":
    video_file = "sample_movie.mp4"   # replace with your video file

    print("Detecting flashes...")
    flashes = detect_flashes(video_file, flash_threshold=40)
    for flash in flashes:
        print(flash)

    print("\nDetecting audio spikes...")
    spikes = detect_audio_spikes(video_file, window_ms=100, audio_threshold=0.15)
    for spike in spikes:
        print(spike)