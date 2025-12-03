<div align="center">

# 🎬 Video Analyzer

### AI-Powered Video Content Moderation & Analysis Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>A comprehensive full-stack video analysis platform that uses machine learning to automatically detect and flag inappropriate content including nudity, violence, weapons, hate speech, and more.</strong>
</p>

[Features](#-features) •
[Demo](#-demo) •
[Installation](#-installation) •
[Architecture](#-architecture) •
[API Reference](#-api-reference) •
[Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Analysis Pipeline](#-analysis-pipeline)
- [Socket.io Events](#-socketio-real-time-events)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Video Analyzer** is an enterprise-grade video content moderation platform designed for organizations that need to automatically screen video content for policy violations. The system combines computer vision, speech recognition, and natural language processing to provide comprehensive content analysis.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| 🎯 **Multi-Category Detection** | Detects nudity, violence, weapons, hate speech, profanity, sexual content, and drug use |
| 📊 **Confidence Scoring** | Provides percentage-based confidence scores for each category |
| 📍 **Timeline Flagging** | Identifies exact timestamps where violations occur |
| 📝 **Transcript Analysis** | Extracts and analyzes audio transcripts for policy violations |
| 🤖 **AI Summarization** | Generates human-readable moderation reports with recommendations |
| 👥 **Multi-Tenant RBAC** | Organization-based access control with viewer/editor/admin roles |
| ⚡ **Real-Time Updates** | Live progress tracking via WebSockets during analysis |

---

## ✨ Features

### 🔐 Authentication & Authorization

- **JWT-Based Authentication** - Secure token-based auth with configurable expiration
- **Multi-Tenant Architecture** - Organization-based data isolation
- **Role-Based Access Control (RBAC)**:
  - `viewer` - View videos and analysis results
  - `editor` - Upload and manage own videos
  - `admin` - Full access including user management
- **Password Security** - bcrypt hashing with salt rounds

### 📤 Video Management

- **Drag & Drop Upload** - Modern file upload with progress indication
- **Multiple Format Support** - MP4, MPEG, QuickTime, AVI, MKV, WebM
- **File Size Limit** - Configurable (default: 500MB)
- **Video Streaming** - HTTP Range request support for seeking
- **Metadata Extraction** - Duration, resolution, codec information
- **Thumbnail Generation** - Automatic preview image creation

### 🔍 Content Analysis Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────▶│   FFmpeg    │────▶│  ML Vision  │────▶│   Report    │
│   Video     │     │  Extraction │     │  Analysis   │     │  Generation │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Audio     │────▶│    Text     │
                    │ Extraction  │     │  Analysis   │
                    └─────────────┘     └─────────────┘
```

#### Analysis Categories & Thresholds

| Category | Detection Method | Flag Threshold |
|----------|-----------------|----------------|
| 🔞 Nudity | Vision AI (skin detection, body poses) | > 30% |
| 💥 Violence | Object detection + motion analysis | > 30% |
| 🔫 Weapons | YOLO object detection | > 30% |
| 💋 Sexual Content | Scene classification + pose estimation | > 30% |
| 🤬 Profanity | Audio transcription + text analysis | > 30% |
| 😠 Hate Speech | NLP classification | > 20% |
| 💊 Drug Use | Object detection + context analysis | > 30% |

### 📊 Analysis Output

- **Confidence Scores** - 0-100% for each category
- **Overall Classification** - `clean`, `review`, or `flagged`
- **Recommended Action** - `approve`, `manual_review`, or `reject`
- **Timeline Events** - Timestamped list of detected violations
- **Transcript Segments** - Flagged audio segments with text
- **Human-Readable Report** - AI-generated moderation summary

### 🎨 Modern Frontend

- **Responsive Design** - Mobile-first, works on all devices
- **Dark Theme** - Easy on the eyes, professional look
- **Animated UI** - Smooth transitions with Framer Motion
- **Real-Time Updates** - Live progress bars during processing
- **Interactive Dashboard** - Filter, search, and sort videos
- **Video Player** - Full-featured player with custom controls

---

## 🛠 Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express** | 5.2.1 | Web framework |
| **MongoDB** | 8.0+ | Database |
| **Mongoose** | 9.0.0 | ODM for MongoDB |
| **Socket.io** | 4.8.1 | Real-time communication |
| **JWT** | 9.0.2 | Authentication tokens |
| **bcrypt** | 6.0.0 | Password hashing |
| **Multer** | 2.0.2 | File upload handling |
| **FFmpeg** | - | Video/audio processing |
| **Axios** | 1.9.0 | HTTP client for ML service |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI library |
| **Vite** | 7.2.5 | Build tool |
| **TailwindCSS** | 3.x | Styling |
| **Framer Motion** | 12.x | Animations |
| **Lucide React** | - | Icons |
| **Socket.io Client** | 4.8.1 | Real-time updates |
| **Axios** | 1.9.0 | HTTP client |

### ML Service (Optional)

| Technology | Purpose |
|------------|---------|
| **FastAPI** | Python web framework |
| **YOLO v8** | Object detection |
| **Whisper** | Speech-to-text |
| **NudeNet** | Nudity detection |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     React + Vite Frontend                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │ │
│  │  │ AuthPage │  │Dashboard │  │  Video   │  │   Socket.io Client   │ │ │
│  │  │          │  │          │  │  Player  │  │  (Real-time updates) │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTP/WebSocket
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    Express.js Backend (Port 5001)                    │ │
│  │  ┌──────────────────────────────────────────────────────────────┐   │ │
│  │  │                      Middleware Stack                         │   │ │
│  │  │  CORS → Auth (JWT) → Rate Limit → Error Handler              │   │ │
│  │  └──────────────────────────────────────────────────────────────┘   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │ │
│  │  │ Auth Routes  │  │ Video Routes │  │    Socket.io Server    │    │ │
│  │  │ /api/auth/*  │  │ /api/videos/*│  │  (Progress & Events)   │    │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐  │
│  │ FFmpeg Service │  │ Text Analysis  │  │    LLM Summarizer          │  │
│  │ - Extract      │  │ - Profanity    │  │ - Generate Reports         │  │
│  │   frames       │  │ - Hate speech  │  │ - Recommendations          │  │
│  │ - Extract      │  │ - Sentiment    │  │ - Human-readable           │  │
│  │   audio        │  │                │  │   summaries                │  │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘  │
│                              │                                            │
│  ┌───────────────────────────▼────────────────────────────────────────┐  │
│  │                  Video Processor Orchestrator                       │  │
│  │  Coordinates all analysis services and aggregates results          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    MongoDB      │       │   File System   │       │   ML Service    │
│  - Users        │       │  - uploads/     │       │   (Optional)    │
│  - Videos       │       │  - processing/  │       │  - YOLO         │
│  - Orgs         │       │  - frames/      │       │  - Whisper      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 6.0+ ([Download](https://www.mongodb.com/try/download/community))
- **FFmpeg** ([Download](https://ffmpeg.org/download.html))
- **Git** ([Download](https://git-scm.com/))

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Surfing-Ninja/Video_Analyzer.git
cd Video_Analyzer

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your settings

# 4. Install frontend dependencies
cd ../frontend
npm install

# 5. Start MongoDB (if not running)
brew services start mongodb-community  # macOS
# or
sudo systemctl start mongod            # Linux

# 6. Start the backend server
cd ../backend
node server.js

# 7. Start the frontend (new terminal)
cd ../frontend
npm run dev
```

### Using Docker (Coming Soon)

```bash
docker-compose up -d
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `/backend` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/video_analyzer

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=524288000  # 500MB in bytes
UPLOAD_DIR=./uploads

# OpenAI (Optional - for enhanced LLM summaries)
OPENAI_API_KEY=sk-your-openai-api-key

# ML Service (Optional)
ML_SERVICE_URL=http://localhost:5002
```

### Frontend Configuration

The frontend uses Vite environment variables. Create `.env` in `/frontend`:

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

---

## 📖 Usage Guide

### 1. User Registration & Login

```bash
# Register a new user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### 2. Upload a Video

```bash
curl -X POST http://localhost:5001/api/videos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "video=@/path/to/video.mp4" \
  -F "title=My Video" \
  -F "description=Video description"
```

### 3. Process Video for Analysis

```bash
curl -X POST http://localhost:5001/api/videos/VIDEO_ID/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Analysis Results

```bash
curl http://localhost:5001/api/videos/VIDEO_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Default Test Account

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `admin123` |
| Role | `admin` |

---

## 📚 API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login user | ❌ |
| `GET` | `/api/auth/me` | Get current user | ✅ |
| `POST` | `/api/auth/logout` | Logout user | ✅ |

### Video Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/videos/upload` | Upload video | ✅ |
| `GET` | `/api/videos` | List all videos | ✅ |
| `GET` | `/api/videos/:id` | Get video details | ✅ |
| `GET` | `/api/videos/stream/:id` | Stream video | ✅ |
| `DELETE` | `/api/videos/:id` | Delete video | ✅ |
| `POST` | `/api/videos/:id/analyze` | Analyze video | ✅ (editor+) |

### Response Formats

#### Video Object

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Sample Video",
  "filename": "1701234567890-video.mp4",
  "path": "/uploads/1701234567890-video.mp4",
  "size": 15728640,
  "mimeType": "video/mp4",
  "duration": 120.5,
  "resolution": { "width": 1920, "height": 1080 },
  "status": "completed",
  "overall": "flagged",
  "recommendedAction": "manual_review",
  "scores": {
    "nudity": 0.15,
    "violence": 0.72,
    "weapons": 0.45,
    "profanity": 0.08,
    "hate_speech": 0.02,
    "sexual_content": 0.12,
    "drug_use": 0.05,
    "overall_confidence": 0.89
  },
  "timeline": [
    {
      "start": 45.2,
      "end": 48.7,
      "category": "violence",
      "score": 0.85,
      "note": "Physical altercation detected"
    }
  ],
  "transcript": [
    {
      "time": 12.5,
      "text": "Sample transcript text",
      "flagged": false
    }
  ],
  "humanDescription": "## Content Analysis Report\n\n...",
  "user": "507f1f77bcf86cd799439012",
  "orgId": "507f1f77bcf86cd799439013",
  "createdAt": "2024-12-03T10:30:00.000Z",
  "updatedAt": "2024-12-03T10:35:00.000Z"
}
```

---

## 🔄 Analysis Pipeline

### Stage 1: Frame Extraction (FFmpeg)
- Extracts frames at configurable FPS (default: 0.5 FPS)
- Adaptive extraction based on video duration
- Outputs frames to `/processing/{videoId}/frames/`

### Stage 2: Audio Extraction
- Extracts audio track as WAV file
- Sample rate: 16kHz (optimized for speech recognition)
- Output: `/processing/{videoId}/audio.wav`

### Stage 3: Vision Analysis
- Analyzes each extracted frame
- Detects objects, poses, and scenes
- Calculates per-frame scores for each category

### Stage 4: Speech Recognition
- Transcribes audio using Whisper (or simulation)
- Generates timestamped transcript segments
- Outputs: text + timestamps

### Stage 5: Text Analysis
- Analyzes transcript for policy violations
- Detects profanity, hate speech, threats
- NLP-based sentiment and intent analysis

### Stage 6: Score Aggregation
- **Weighted Formula**: `60% * max_score + 30% * avg_score + 10% * frequency`
- Combines vision and text scores
- Generates timeline of flagged moments

### Stage 7: Report Generation
- AI-generated human-readable summary
- Includes severity assessment
- Provides recommended moderation action

---

## 📡 Socket.io Real-Time Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ token: "JWT" }` | Authenticate socket connection |
| `joinRoom` | `{ room: "roomId" }` | Join a notification room |
| `leaveRoom` | `{ room: "roomId" }` | Leave a notification room |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticated` | `{ userId, orgId }` | Auth successful |
| `videoUploaded` | `{ video }` | New video uploaded |
| `analysisProgress` | `{ videoId, stage, progress, message }` | Processing progress |
| `analysisComplete` | `{ video }` | Analysis finished |
| `error` | `{ message }` | Error occurred |

### Progress Stages

```javascript
// Stage progression during analysis
{
  stage: "extracting",    // 0-20%
  stage: "analyzing",     // 20-70%
  stage: "transcribing",  // 70-85%
  stage: "summarizing",   // 85-95%
  stage: "complete"       // 100%
}
```

---

## 📁 Project Structure

```
Video_Analyzer/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Auth logic
│   │   └── videoController.js    # Video CRUD & analysis
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── errorHandler.js       # Global error handling
│   ├── models/
│   │   ├── Organization.js       # Multi-tenant orgs
│   │   ├── User.js               # User model
│   │   └── Video.js              # Video + analysis schema
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/*
│   │   └── videoRoutes.js        # /api/videos/*
│   ├── services/
│   │   ├── ffmpegService.js      # Frame/audio extraction
│   │   ├── llmSummarizerService.js # Report generation
│   │   ├── textAnalysisService.js  # NLP analysis
│   │   └── videoProcessorService.js # Main orchestrator
│   ├── utils/
│   │   ├── generateToken.js      # JWT generation
│   │   └── uploadConfig.js       # Multer config
│   ├── uploads/                  # Video storage
│   ├── processing/               # Temp processing files
│   ├── app.js                    # Express app
│   ├── server.js                 # Entry point + Socket.io
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Auth state management
│   │   │   └── SocketContext.jsx # Socket.io provider
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx      # Login/Register
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   └── VideoPlayer.jsx   # Video playback
│   │   ├── App.jsx               # Root component
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── ml-service/                   # Optional Python ML service
│   ├── app.py                    # FastAPI server
│   ├── requirements.txt
│   └── README.md
│
├── .gitignore
└── README.md
```

---

## 🔒 Security

### Authentication
- **JWT Tokens** - RS256 signed, configurable expiration
- **Password Hashing** - bcrypt with 10 salt rounds
- **Token Refresh** - Automatic refresh on activity

### Authorization
- **RBAC** - Role-based access (viewer/editor/admin)
- **Multi-Tenancy** - Organization-based data isolation
- **Resource Ownership** - Users can only access their own videos

### Data Protection
- **File Validation** - MIME type and extension checks
- **Size Limits** - Configurable max upload size
- **Sanitization** - Input validation on all endpoints

### Best Practices
- CORS configured for allowed origins
- Helmet.js for HTTP security headers
- Rate limiting on auth endpoints
- No sensitive data in logs

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure MongoDB Atlas or secured MongoDB
- [ ] Set up HTTPS with SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting
- [ ] Set up backup for uploads directory

### Recommended Hosting

| Component | Recommended Service |
|-----------|-------------------|
| Backend | AWS EC2, DigitalOcean, Railway |
| Frontend | Vercel, Netlify, Cloudflare Pages |
| Database | MongoDB Atlas |
| File Storage | AWS S3, Cloudflare R2 |
| ML Service | AWS Lambda, Google Cloud Run |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📝 License

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [FFmpeg](https://ffmpeg.org/) - Video processing
- [OpenAI Whisper](https://github.com/openai/whisper) - Speech recognition
- [YOLO](https://github.com/ultralytics/ultralytics) - Object detection
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Socket.io](https://socket.io/) - Real-time communication

---

<div align="center">

**Built with ❤️ by [Surfing-Ninja](https://github.com/Surfing-Ninja)**

⭐ Star this repository if you found it helpful!

</div>
