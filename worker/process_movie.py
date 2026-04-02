import sys
import os
import subprocess
import traceback
import shutil

from detectors.flash_detector import detect_flash_events
from detectors.audio_detector import detect_audio_spikes
from utils.result_utils import save_json_results
from utils.grouping_utils import group_flash_events, group_audio_events

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def extract_frames(movie_path, movie_name):
    frames_output_dir = os.path.join(OUTPUT_DIR, "frames", movie_name)
    os.makedirs(frames_output_dir, exist_ok=True)

    frame_pattern = os.path.join(frames_output_dir, "frame_%04d.jpg")

    command = [
        "ffmpeg",
        "-y",
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
        "-y",
        "-i", movie_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "44100",
        "-ac", "1",
        audio_output_path
    ]

    print("Extracting audio and converting to WAV...")
    subprocess.run(command, check=True)
    print(f"Audio saved to: {audio_output_path}")

    return audio_output_path

def cleanup_temp_files(movie_name):
    frames_output_dir = os.path.join(OUTPUT_DIR, "frames", movie_name)
    audio_output_path = os.path.join(OUTPUT_DIR, "audio", f"{movie_name}.wav")

    try:
        if os.path.exists(frames_output_dir):
            shutil.rmtree(frames_output_dir)
            print(f"Deleted frames folder: {frames_output_dir}")
    except Exception as e:
        print(f"Warning: could not delete frames folder: {repr(e)}")

    try:
        if os.path.exists(audio_output_path):
            os.remove(audio_output_path)
            print(f"Deleted audio file: {audio_output_path}")
    except Exception as e:
        print(f"Warning: could not delete audio file: {repr(e)}")

def process_movie(movie_path):
    movie_path = os.path.abspath(movie_path)

    if not os.path.exists(movie_path):
        print(f"Error: file not found -> {movie_path}")
        return 1

    movie_name = os.path.splitext(os.path.basename(movie_path))[0]

    flash_model_path = os.path.join(MODELS_DIR, "flash_model.joblib")
    audio_model_path = os.path.join(MODELS_DIR, "audio_model.joblib")

    try:
        print(f"Processing movie: {movie_path}")

        extract_frames(movie_path, movie_name)
        audio_path = extract_audio(movie_path, movie_name)

        print("Running flash detection...")
        flash_events = detect_flash_events(movie_path, flash_model_path)
        grouped_flash_warnings = group_flash_events(flash_events)

        print("Running audio spike detection...")
        audio_events = detect_audio_spikes(audio_path, audio_model_path)
        grouped_audio_warnings = group_audio_events(audio_events)

        all_results = {
            "movie_name": movie_name,
            "flash_warnings": grouped_flash_warnings,
            "audio_warnings": grouped_audio_warnings
        }

        results_dir = os.path.join(OUTPUT_DIR, "results")
        results_file = save_json_results(results_dir, f"{movie_name}_results.json", all_results)

        print(f"Results saved to: {results_file}")

        cleanup_temp_files(movie_name)

        print("Worker pipeline completed successfully.")
        return 0

    except subprocess.CalledProcessError as e:
        print("FFmpeg processing failed:", e)
        return 1
    except Exception as e:
        print("Unexpected error:", repr(e))
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_movie.py <movie_path>")
        sys.exit(1)


    movie_path = sys.argv[1]
    exit_code = process_movie(movie_path)
    sys.exit(exit_code)