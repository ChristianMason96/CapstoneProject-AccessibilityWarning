import cv2
import numpy as np
from moviepy import VideoFileClip
import sys
import requests

BACKEND_URL = "http://localhost:3000/api/results"

video_file = sys.argv[1]
job_id = sys.argv[2]


def send_result(type, time):
    requests.post(BACKEND_URL, json={
        "jobId": job_id,
        "type": type,
        "start": time,
        "end": time
    })


def detect_flashes(video_path):
    cap = cv2.VideoCapture(video_path)

    prev = None
    frame = 0
    fps = cap.get(cv2.CAP_PROP_FPS)

    while True:
        ret, img = cap.read()
        if not ret:
            break

        frame += 1
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)

        if prev is not None and brightness - prev > 40:
            time = round(frame / fps, 2)
            send_result("flash", time)

        prev = brightness

    cap.release()


def detect_audio(video_path):
    clip = VideoFileClip(video_path)
    audio = clip.audio

    if audio is None:
        return

    arr = audio.to_soundarray(fps=44100)

    if len(arr.shape) > 1:
        arr = np.mean(arr, axis=1)

    window = 4410
    prev = None

    for i in range(0, len(arr), window):
        segment = arr[i:i+window]
        if len(segment) == 0:
            continue

        loud = np.sqrt(np.mean(segment**2))

        if prev and loud - prev > 0.15:
            time = round(i / 44100, 2)
            send_result("audio", time)

        prev = loud

    clip.close()


if __name__ == "__main__":
    print("Processing:", video_file)

    detect_flashes(video_file)
    detect_audio(video_file)

    print("Done")