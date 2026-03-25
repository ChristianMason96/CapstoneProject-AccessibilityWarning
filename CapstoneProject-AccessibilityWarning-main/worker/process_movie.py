import sys
import os

def process_movie(movie_path):
    if not os.path.exists(movie_path):
        print(f"Error: file not found -> {movie_path}")
        return 1

    print(f"Processing movie: {movie_path}")
    print("Worker pipeline started successfully.")
    return 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_movie.py <movie_path>")
        sys.exit(1)

    movie_path = sys.argv[1]
    exit_code = process_movie(movie_path)
    sys.exit(exit_code)