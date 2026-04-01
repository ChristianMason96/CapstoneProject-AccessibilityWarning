1. Storage Structure and File Naming Conventions
The project stores uploaded videos/movie files and generates analysis outputs using a S3 style bucket structure. During this development phase, this structure will be implemented locally using Docker storage. In a later phase, the same structure can be used in AWS S3.

2. Storage Structure
The storage system will organize files by movie ID.

The structure should look like:
uploads/{movieID}/original/
uploads/{movieID}/frames/
uploads/{movieID}/audio/
uploads/{movieID}/results/

2.1. Folders meaning
- original - stores the original uploaded movie file
- frames - stores extracted video frames used for visual analysis
- audio - stores extracted audio files used for sound analysis
- results - stores generated analysis results such as JSON output

2.2. Example Paths
uploads/movie_1/original/test.mp4
uploads/movie_1/frames/frame_1.jpg
uploads/movie_1/audio/audio_track.wav
uploads/movie_1/results/analysis_result.json

2.3. File Name Conventions 
To keep storage organized and easy to process, files should follow these naming rules:
- use lowercase letters only
- use underscores instead of spaces
- include the movie title and year when appropriate
- use sequential numbering for extracted frames

2.4. Example File Names
test.mp4
frame_1.jpg
audio_track.wav
analysis_result.json

2.5. Design Note
This structure is being defined now so the team can use it in local development this semester and later reuse the same organization when migrating to AWS S3.
