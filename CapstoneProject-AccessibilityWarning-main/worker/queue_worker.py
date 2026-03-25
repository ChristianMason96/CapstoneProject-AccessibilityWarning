import os
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from bullmq import Worker
from helpers.s3_download import download_file_from_s3

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / "backend" / ".env")

QUEUE_NAME = os.getenv("BULLMQ_QUEUE_NAME", "movie-processing")
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")

TEMP_DOWNLOADS_DIR = BASE_DIR / "temp_downloads"


def resolve_local_movie_path(file_ref: dict) -> Path:
    movie_path = file_ref.get("path")
    if not movie_path:
        raise ValueError("Missing local file path in fileReference")

    path = Path(movie_path)

    if path.is_absolute():
        return path

    return (BASE_DIR / movie_path).resolve()


def resolve_s3_movie_path(file_ref: dict) -> Path:
    bucket = file_ref.get("bucket")
    key = file_ref.get("key")
    file_name = file_ref.get("fileName", "movie.mp4")
    movie_id = file_ref.get("movieId", "unknown_movie")

    if not bucket or not key:
        raise ValueError("Missing bucket or key in S3 fileReference")

    local_path = TEMP_DOWNLOADS_DIR / movie_id / "original" / file_name

    print(f"Downloading from bucket={bucket}")
    print(f"Downloading key={key}")
    print(f"Saving to local path={local_path}")

    download_file_from_s3(bucket, key, str(local_path))

    print("Download finished successfully")
    return local_path


def resolve_movie_path_from_reference(file_ref: dict) -> Path:
    provider = file_ref.get("provider")

    if not provider:
        raise ValueError("Missing provider in fileReference")

    if provider == "local":
        return resolve_local_movie_path(file_ref)

    if provider == "s3":
        return resolve_s3_movie_path(file_ref)

    raise ValueError(f"Unsupported storage provider: {provider}")


async def process_job(job, token):
    try:
        print("\n=== JOB RECEIVED ===")
        print(f"job.id={job.id}")
        print(f"job.name={job.name}")
        print(f"job.data={json.dumps(job.data, indent=2)}")

        await job.updateProgress(5)

        file_ref = job.data.get("fileReference")
        if not file_ref:
            raise ValueError("Missing fileReference in job payload")

        movie_path = resolve_movie_path_from_reference(file_ref)

        if not movie_path.exists():
            raise FileNotFoundError(
                f"Movie file not found after download/resolve: {movie_path}"
            )

        print(f"Resolved movie path: {movie_path}")

        file_size = movie_path.stat().st_size
        print(f"Downloaded file size: {file_size} bytes")

        await job.updateProgress(100)

        return {
            "status": "received",
            "provider": file_ref.get("provider"),
            "moviePath": str(movie_path),
            "fileSizeBytes": file_size,
            "message": "BullMQ Python worker received the job successfully"
        }

    except Exception as e:
        print(f"ERROR in process_job: {type(e).__name__}: {e}")
        raise


async def main():
    print(f"Starting worker for queue={QUEUE_NAME}")
    print(f"Redis={REDIS_URL}")
    print(f"AWS_S3_ENDPOINT={os.getenv('AWS_S3_ENDPOINT')}")
    print(f"AWS_ACCESS_KEY_ID={os.getenv('AWS_ACCESS_KEY_ID')}")
    print(f"AWS_S3_BUCKET={os.getenv('AWS_S3_BUCKET')}")

    worker = Worker(
        QUEUE_NAME,
        process_job,
        {
            "connection": REDIS_URL,
        },
    )

    try:
        while True:
            await asyncio.sleep(3600)
    finally:
        await worker.close()


if __name__ == "__main__":
    asyncio.run(main())