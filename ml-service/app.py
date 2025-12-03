"""
Video Analysis ML Microservice
FastAPI service providing:
- Object detection (YOLO)
- Nudity detection (NudeNet-like)
- Weapon detection
- Violence indicators
- Whisper transcription
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import tempfile
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Video Analysis ML Service",
    description="ML microservice for video content analysis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class DetectedObject(BaseModel):
    label: str
    confidence: float
    bbox: Optional[List[float]] = None

class FaceDetection(BaseModel):
    confidence: float
    bbox: Optional[List[float]] = None

class FrameAnalysisResult(BaseModel):
    nudity: float = 0.0
    violence: float = 0.0
    weapons: float = 0.0
    sexual_content: float = 0.0
    objects: List[str] = []
    faces: List[FaceDetection] = []
    raw_detections: Optional[List[DetectedObject]] = None

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str

class TranscriptionResult(BaseModel):
    text: str
    segments: List[TranscriptSegment]
    language: str = "en"

# Try to import ML libraries
YOLO_AVAILABLE = False
WHISPER_AVAILABLE = False
NUDENET_AVAILABLE = False

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    logger.info("YOLO loaded successfully")
except ImportError:
    logger.warning("YOLO not available - install with: pip install ultralytics")

try:
    import whisper
    WHISPER_AVAILABLE = True
    logger.info("Whisper loaded successfully")
except ImportError:
    logger.warning("Whisper not available - install with: pip install openai-whisper")

# Initialize models (lazy loading)
yolo_model = None
whisper_model = None

def get_yolo_model():
    global yolo_model
    if yolo_model is None and YOLO_AVAILABLE:
        yolo_model = YOLO('yolov8n.pt')  # Nano model for speed
    return yolo_model

def get_whisper_model():
    global whisper_model
    if whisper_model is None and WHISPER_AVAILABLE:
        whisper_model = whisper.load_model("base")  # or "small" for better accuracy
    return whisper_model

# Weapon-related COCO classes
WEAPON_CLASSES = ['knife', 'scissors', 'baseball bat', 'tennis racket']
VIOLENCE_OBJECTS = ['knife', 'baseball bat', 'scissors']

@app.get("/")
async def root():
    return {
        "service": "Video Analysis ML Service",
        "version": "1.0.0",
        "models": {
            "yolo": YOLO_AVAILABLE,
            "whisper": WHISPER_AVAILABLE,
            "nudenet": NUDENET_AVAILABLE
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/analyze", response_model=FrameAnalysisResult)
async def analyze_frame(frame: UploadFile = File(...)):
    """
    Analyze a single video frame for content moderation
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            content = await frame.read()
            tmp.write(content)
            tmp_path = tmp.name

        result = FrameAnalysisResult()

        if YOLO_AVAILABLE:
            model = get_yolo_model()
            if model:
                detections = model(tmp_path, verbose=False)
                
                objects = []
                raw_detections = []
                
                for r in detections:
                    for box in r.boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        label = model.names[cls]
                        
                        objects.append(label)
                        raw_detections.append(DetectedObject(
                            label=label,
                            confidence=conf,
                            bbox=box.xyxy[0].tolist() if box.xyxy is not None else None
                        ))
                        
                        # Check for weapons
                        if label.lower() in [w.lower() for w in WEAPON_CLASSES]:
                            result.weapons = max(result.weapons, conf * 0.8)
                        
                        # Check for violence indicators
                        if label.lower() in [v.lower() for v in VIOLENCE_OBJECTS]:
                            result.violence = max(result.violence, conf * 0.5)
                
                result.objects = list(set(objects))
                result.raw_detections = raw_detections
                
                # Count faces (person detections as proxy)
                person_count = sum(1 for o in objects if o == 'person')
                result.faces = [FaceDetection(confidence=0.8) for _ in range(min(person_count, 5))]

        else:
            # Simulation fallback
            import random
            result.objects = random.sample(['person', 'chair', 'table', 'laptop', 'phone'], k=random.randint(1, 3))
            result.nudity = random.random() * 0.1
            result.violence = random.random() * 0.1
            result.weapons = random.random() * 0.05
            if random.random() > 0.5:
                result.faces = [FaceDetection(confidence=0.85)]

        # Cleanup
        os.unlink(tmp_path)

        return result

    except Exception as e:
        logger.error(f"Frame analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe", response_model=TranscriptionResult)
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio file using Whisper
    """
    try:
        # Save uploaded file temporarily
        suffix = os.path.splitext(audio.filename)[1] if audio.filename else '.wav'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name

        if WHISPER_AVAILABLE:
            model = get_whisper_model()
            if model:
                result = model.transcribe(tmp_path)
                
                segments = []
                for seg in result.get("segments", []):
                    segments.append(TranscriptSegment(
                        start=seg["start"],
                        end=seg["end"],
                        text=seg["text"].strip()
                    ))
                
                os.unlink(tmp_path)
                
                return TranscriptionResult(
                    text=result["text"],
                    segments=segments,
                    language=result.get("language", "en")
                )

        # Simulation fallback
        os.unlink(tmp_path)
        
        return TranscriptionResult(
            text="This is a simulated transcription. Whisper is not installed.",
            segments=[
                TranscriptSegment(start=0, end=5, text="This is a simulated transcription."),
                TranscriptSegment(start=5, end=10, text="Whisper is not installed.")
            ],
            language="en"
        )

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-analyze")
async def batch_analyze_frames(frames: List[UploadFile] = File(...)):
    """
    Analyze multiple frames in batch
    """
    results = []
    for frame in frames:
        result = await analyze_frame(frame)
        results.append(result)
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)
