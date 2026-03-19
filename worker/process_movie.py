import sys
import os
import subprocess

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

def extract_frames(movie_path, movie_name):
    frames_output_dir = os.path.join(OUTPUT_DIR, "frames", movie_name)
    os.makedirs(frames_output_dir, exist_ok=True)

    frame_pattern = os.path.join(frames_output_dir, "frame_%04d.jpg")

    command = [
        "ffmpeg",
        "-i", movie_path,
        frame_pattern
    ]

    print("Extracting video frames...")
    subprocess.run(command, check=True)
    print(f"Frames saved to: {frames_output_dir}")


def extract_audio(movie_path, movie_name):
    audio_output_dir = os.path.join(OUTPUT_DIR, "audio")
    os.makedirs(audio_output_dir, exist_ok=True)

    audio_output_path = os.path.join(audio_output_dir, f"{movie_name}.wav")

    command = [
        "ffmpeg",
        "-i", movie_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "44100",
        "-ac", "2",
        audio_output_path
    ]

    print("Extracting audio and converting to WAV...")
    subprocess.run(command, check=True)
    print(f"Audio saved to: {audio_output_path}")


def process_movie(movie_path):
    movie_path = os.path.abspath(movie_path)

    if not os.path.exists(movie_path):
        print(f"Error: file not found -> {movie_path}")
        return 1

    # Get filename without extension
    movie_name = os.path.splitext(os.path.basename(movie_path))[0]

    try:
        print(f"Processing movie: {movie_path}")
        extract_frames(movie_path, movie_name)
        extract_audio(movie_path, movie_name)
        print("Worker pipeline completed successfully.")
        return 0
    except subprocess.CalledProcessError as e:
        print("FFmpeg processing failed:", e)
        return 1
    except Exception as e:
        print("Unexpected error:", e)
        return 1


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_movie.py <movie_path>")
        sys.exit(1)

    movie_path = sys.argv[1]
    exit_code = process_movie(movie_path)
    sys.exit(exit_code)