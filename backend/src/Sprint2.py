import cv2
import os


def detect_flashes(video_path, brightness_threshold=40, min_gap_seconds=0.3):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("Error: Could not open video.")
        return []

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        print("Error: Could not read FPS.")
        return []

    flash_times = []
    prev_brightness = None
    last_flash_time = -min_gap_seconds
    frame_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        current_brightness = gray.mean()

        if prev_brightness is not None:
            brightness_diff = current_brightness - prev_brightness
            current_time = frame_index / fps

            if brightness_diff > brightness_threshold:
                if current_time - last_flash_time >= min_gap_seconds:
                    flash_times.append(round(current_time, 2))
                    last_flash_time = current_time
                    print(f"Flash detected at {current_time:.2f} seconds")

        prev_brightness = current_brightness
        frame_index += 1

    cap.release()
    return flash_times


def save_results(flash_times, output_file="output/flash_results.txt"):
    os.makedirs("output", exist_ok=True)

    with open(output_file, "w") as f:
        if flash_times:
            f.write("Detected flash timestamps (seconds):\n")
            for t in flash_times:
                f.write(f"{t}\n")
        else:
            f.write("No flashes detected.\n")

    print(f"Results saved to {output_file}")
    print(f"Saved at: {os.path.abspath(output_file)}") 


if __name__ == "__main__":
    video_file = "/Users/abhinav/Downloads/sample_video4.mp4"  

    if not os.path.exists(video_file):
        print("File does not exist!")
    else:
        print("File found, starting detection...")

        flashes = detect_flashes(video_file)

        print("\nFinal Results:")
        if flashes:
            for t in flashes:
                print(f"Flash at {t} sec")
        else:
            print("No flashes detected.")

        save_results(flashes)