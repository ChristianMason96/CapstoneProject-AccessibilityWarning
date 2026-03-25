import os
import json
import asyncio
from pathlib import Path
from bullmq import Worker

QUEUE_NAME = os.getenv("BULLMQ_QUEUE_NAME", "movie-processing")
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "worker_output"


def resolve_movie_path(movie_path: str) -> Path:
    path = Path(movie_path)

    if path.is_absolute():
        return path

    # backend sends ../uploads/test.mp4, normalize it from project root
    normalized = (BASE_DIR / movie_path).resolve()
    return normalized


async def process_job(job, token):
    print("\n=== JOB RECEIVED ===")
    print(f"job.id={job.id}")
    print(f"job.name={job.name}")
    print(f"job.data={json.dumps(job.data, indent=2)}")

    await job.update_progress(5)

    movie_path_raw = job.data.get("moviePath")
    if not movie_path_raw:
        raise ValueError("Missing moviePath in job payload")

    movie_path = resolve_movie_path(movie_path_raw)

    if not movie_path.exists():
        raise FileNotFoundError(f"Movie file not found: {movie_path}")

    print(f"Resolved movie path: {movie_path}")

    await job.update_progress(100)

    return {
        "status": "received",
        "moviePath": str(movie_path),
        "message": "BullMQ Python worker received the job successfully"
    }


async def main():
    print(f"Starting worker for queue={QUEUE_NAME}")
    print(f"Redis={REDIS_URL}")

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