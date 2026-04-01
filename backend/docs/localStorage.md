# Local Development Storage for Media Uploads
For the current phase of the Capstone project, the team decided that media uploads will be stored locally instead of using AWS S3. This approach allows the team to developand test the upload workflow without consuming resources or creating unnecessary storage costs during early development phases.

To support this, the project will use a local object storage service running in Docker. This local storage solution will simulate the behavior of AWS S3 so that movie uploads, file retrieval, and processing workflows can be tested in a development enviroment.

Using local storage this semester provides the following benefits:
- reduces cloud usage and cost during development
- allows the team to test media uploads safely 
- makes debugging easier because files remain available locally
- prepares the application for a smoother migration to AWS S3 in the next semester.

The storage structure used locally will follow the same organization planned for production. This means uploaded movie files and generated outputs will be grouped in a consistent way, making it easier to switch from local development storage to AWS S3 later in the project.

# Planned Migration to AWS S3
In future project phases, the local storage solution will be replaced with AWS S3 for production cloud storage. Because the project uses S3 style bucket structure and name convention from the beggining, the migration to AWS S3 should require only configuration changes rather than a full redesign of the storage system.

# Local Storage Setup
For local development, the project uses MinIO as an S3-compatible object storage service. MinIO runs inside a Docker container and allows the team to simulate AWS S3 behavior while testing media uploads and file storage locally.

The storage service is started using Docker Compose from the project root directory. To start the local storage service, run the following command:

docker compose up -d

This command starts the MinIO container and creates the local object storage service used for development and testing.

# Accessing the Storage Console
After the container starts, the MinIO web console can be accessed in a web browser using the following address:

http://localhost:9001

# Login credentials:
username: admin
password: password123

The web console allows developers to view buckets, upload files, and manage stored media during development.

# Development Bucket
During development, the project uses the following bucket:

movie-accessibility-dev

Inside this bucket, uploaded movie files and generated outputs follow the storage structure defined for the project.

Example structure:

uploads/{movieId}/original/
uploads/{movieId}/frames/
uploads/{movieId}/audio/
uploads/{movieId}/results/

Example files stored in the bucket:

uploads/movie_1/original/test.mp4
uploads/movie_1/frames/frame_1.jpg
uploads/movie_001/audio/audio_track.wav
uploads/movie_001/results/analysis_results.json

This structure mirrors the organization planned for AWS S3, ensuring that the transition to cloud storage in future project phases can be completed with minimal changes.