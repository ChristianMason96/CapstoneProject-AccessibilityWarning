
"""Run flash and audio detection for one uploaded movie.

OpenCV reads movie frames directly for flash detection.
There is no need to extract every frame to JPEG first.
"""

import os
import shutil
import subprocess
import sys
import traceback

from detectors.flash_detector import detect_flash_events
from detectors.audio_detector import detect_audio_spikes
from utils.result_utils import save_json_results
from utils.grouping_utils import (
    group_flash_events,
    group_audio_events,
)

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

OUTPUT_DIR = os.path.join(BASE_DIR, "output")
MODELS_DIR = os.path.join(
    os.path.dirname(__file__), "models"
)


def has_audio_stream(movie_path):
    """Check whether the movie contains an audio stream."""

    completed = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-select_streams", "a:0",
            "-show_entries", "stream=index",
            "-of", "csv=p=0",
            movie_path,
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    return bool(completed.stdout.strip())


def extract_audio(movie_path, movie_name):
    """Convert the movie's audio track to a mono WAV file."""

    audio_dir = os.path.join(OUTPUT_DIR, "audio")
    os.makedirs(audio_dir, exist_ok=True)

    wav_path = os.path.join(
        audio_dir,
        f"{movie_name}.wav"
    )

    command = [
        "ffmpeg",
        "-y",
        "-i", movie_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "44100",
        "-ac", "1",
        wav_path,
    ]

    print("Extracting audio to WAV...")

    subprocess.run(
        command,
        check=True
    )

    return wav_path


def cleanup_temp_files(movie_name):
    """Remove temporary audio and leftover legacy frame files."""

    wav_path = os.path.join(
        OUTPUT_DIR,
        "audio",
        f"{movie_name}.wav"
    )

    old_frames_dir = os.path.join(
        OUTPUT_DIR,
        "frames",
        movie_name
    )

    for temporary_path in [wav_path, old_frames_dir]:
        try:
            if os.path.isdir(temporary_path):
                shutil.rmtree(temporary_path)

            elif os.path.exists(temporary_path):
                os.remove(temporary_path)

        except OSError as error:
            print(
                f"Warning: could not clean up "
                f"{temporary_path}: {error}"
            )


def process_movie(movie_path):
    """Process the uploaded movie and save grouped warning results."""

    movie_path = os.path.abspath(movie_path)

    if not os.path.isfile(movie_path):
        print(f"Movie not found: {movie_path}")
        return 1

    movie_name = os.path.splitext(
        os.path.basename(movie_path)
    )[0]

    flash_model_path = os.path.join(
        MODELS_DIR,
        "flash_model.joblib"
    )

    audio_model_path = os.path.join(
        MODELS_DIR,
        "audio_model.joblib"
    )

    try:
        print(f"Processing movie: {movie_path}")

        # Flash detection reads video frames directly using OpenCV.
        print("Running flash detection...")

        flash_events = detect_flash_events(
            movie_path,
            flash_model_path
        )

        flash_warnings = group_flash_events(
            flash_events
        )

        # Only run audio extraction if the movie has audio.
        if has_audio_stream(movie_path):
            audio_path = extract_audio(
                movie_path,
                movie_name
            )

            print("Running audio spike detection...")

            audio_events = detect_audio_spikes(
                audio_path,
                audio_model_path
            )

            audio_warnings = group_audio_events(
                audio_events
            )

        else:
            print(
                "No audio track found. "
                "Skipping audio detection."
            )

            audio_warnings = []

        result = {
            "movie_name": movie_name,
            "flash_warnings": flash_warnings,
            "audio_warnings": audio_warnings,
        }

        result_file = save_json_results(
            os.path.join(OUTPUT_DIR, "results"),
            f"{movie_name}_results.json",
            result,
        )

        print(f"Results saved to: {result_file}")

        return 0

    except (
        subprocess.CalledProcessError,
        FileNotFoundError
    ) as error:
        print(f"FFmpeg/ffprobe failed: {error}")
        return 1

    except Exception as error:
        print(f"Movie processing failed: {error!r}")
        traceback.print_exc()
        return 1

    finally:
        # This runs on both success and failure.
        cleanup_temp_files(movie_name)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(
            "Usage: python process_movie.py <movie_path>"
        )
        sys.exit(1)

    sys.exit(
        process_movie(sys.argv[1])
    )
