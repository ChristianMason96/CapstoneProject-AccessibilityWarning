
# Capstone - Local Startup

## Current application

Angular (4200)
-> Express API (3000)
-> PostgreSQL / Redis / BullMQ
-> Node worker
-> Python / FFmpeg
-> PostgreSQL warning results
-> Angular report

## Requirements

- Node.js and npm
- PostgreSQL with backend/schema.sql
- Redis running on port 6379
- Python virtual environment
- FFmpeg and ffprobe installed
- backend/.env configured locally

## Startup

Terminal 1:
redis-server

Terminal 2:
cd backend
npm run dev

Terminal 3:
Activate the worker virtual environment
cd backend
node worker.js

Terminal 4:
cd frontend
npm start

Open http://localhost:4200

## Recommended local .env variables

PORT=3000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:4200

DB_HOST=localhost
DB_PORT=5432
DB_NAME=capstone_db
DB_USER=postgres
DB_PASSWORD=your-local-password

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
MAX_UPLOAD_MB=250

Never commit real passwords or .env files.

## Verification

- MP4 with video and audio completes.
- MP4 with video and no audio completes.
- Original movie filename appears on the report.
- Warning data is stored in PostgreSQL.
- Failed uploads show an error.
- Temporary WAV files are cleaned up.

## Deployment

Docker Compose and AWS S3/RDS/EC2 are separate
deployment tasks to complete after the local
application has been verified.
