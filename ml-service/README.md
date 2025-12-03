# Video Analysis ML Microservice

A FastAPI-based microservice for video content analysis using ML models.

## Features

- **Object Detection**: YOLOv8 for detecting objects, people, and potential weapons
- **Audio Transcription**: OpenAI Whisper for speech-to-text
- **Content Analysis**: Nudity, violence, and weapon detection scores

## Installation

### Basic (simulation mode)
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

### Full ML Support
```bash
pip install -r requirements.txt
pip install ultralytics openai-whisper torch torchvision

# For GPU support (CUDA 11.8)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

## Usage

### Start the service
```bash
uvicorn app:app --host 0.0.0.0 --port 5002 --reload
```

### API Endpoints

#### Health Check
```bash
curl http://localhost:5002/health
```

#### Analyze Frame
```bash
curl -X POST http://localhost:5002/analyze \
  -F "frame=@path/to/frame.jpg"
```

#### Transcribe Audio
```bash
curl -X POST http://localhost:5002/transcribe \
  -F "audio=@path/to/audio.wav"
```

## Response Format

### Frame Analysis
```json
{
  "nudity": 0.0,
  "violence": 0.1,
  "weapons": 0.0,
  "sexual_content": 0.0,
  "objects": ["person", "chair", "laptop"],
  "faces": [{"confidence": 0.85}]
}
```

### Transcription
```json
{
  "text": "Full transcript text...",
  "segments": [
    {"start": 0.0, "end": 5.0, "text": "First sentence."},
    {"start": 5.0, "end": 10.0, "text": "Second sentence."}
  ],
  "language": "en"
}
```

## Environment Variables

- `CUDA_VISIBLE_DEVICES`: GPU device IDs (default: 0)
- `WHISPER_MODEL`: Whisper model size (default: base)

## Docker

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5002
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5002"]
```
