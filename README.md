# Video Analyzer

A full-stack video upload and analysis application with Node.js, Express, MongoDB, and React.

## Project Structure

```
/backend
  /config          - Database configuration
  /controllers     - Route controllers (auth, video)
  /middleware      - Auth, error handling middleware
  /models          - Mongoose models (User, Video)
  /routes          - API route definitions
  /utils           - Utility functions (upload, video processing, JWT)
  /uploads         - Video upload directory (auto-created)
  app.js           - Express app configuration
  server.js        - Server entry point with Socket.io
  
/frontend
  - Vite + React application
```

## Features

### Backend
- ✅ JWT Authentication (register, login, protected routes)
- ✅ File upload with Multer (video files only, 100MB limit)
- ✅ MongoDB integration with Mongoose
- ✅ Socket.io for real-time updates
- ✅ FFmpeg integration for video processing
- ✅ Video metadata extraction
- ✅ User authorization & role-based access
- ✅ Error handling middleware
- ✅ CORS enabled

### API Endpoints

#### Auth Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)

#### Video Routes (`/api/videos`)
- `POST /upload` - Upload video (protected)
- `GET /` - Get all user videos (protected)
- `GET /:id` - Get single video (protected)
- `DELETE /:id` - Delete video (protected)
- `POST /:id/process` - Process video (protected)

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies** (already done)
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Edit `.env` file with your settings:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/video_analyzer
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

4. **Make sure MongoDB is running**
   ```bash
   # If using MongoDB locally
   mongod
   
   # Or use MongoDB Atlas (update MONGODB_URI in .env)
   ```

5. **Start the server**
   ```bash
   # Development mode (requires nodemon)
   npm install -g nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies** (already done)
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

## Technologies Used

### Backend
- **Express** - Web framework
- **Mongoose** - MongoDB ODM
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Multer** - File upload handling
- **Socket.io** - Real-time communication
- **FFmpeg** - Video processing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library (Vite)
- **Axios** - HTTP client
- **Socket.io-client** - Real-time updates

## Usage

### User Registration
```javascript
POST /api/auth/register
Body: {
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

### User Login
```javascript
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
```

### Upload Video
```javascript
POST /api/videos/upload
Headers: {
  "Authorization": "Bearer <token>"
}
Body: FormData with:
  - video: <video_file>
  - title: "My Video"
  - description: "Video description"
```

## Socket.io Events

- `connection` - Client connected
- `disconnect` - Client disconnected
- `videoUploaded` - New video uploaded
- `videoProcessingProgress` - Video processing progress update
- `videoProcessingComplete` - Video processing completed
- `joinRoom` - Join a room
- `leaveRoom` - Leave a room

## Development Notes

### Video Processing
The FFmpeg integration is currently a placeholder. You can extend `utils/videoProcessor.js` to add:
- Video transcoding
- Thumbnail generation
- Format conversion
- Video analysis
- Quality adjustment

### File Uploads
- Videos are stored in `/backend/uploads/` directory
- Max file size: 100MB (configurable in `utils/uploadConfig.js`)
- Allowed formats: MP4, MPEG, QuickTime, AVI, MKV

### Security
- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Protected routes with auth middleware
- File type validation
- User ownership verification for video operations

## Next Steps

1. Implement actual video processing logic in `videoProcessor.js`
2. Add frontend components for video upload and playback
3. Implement real-time progress tracking
4. Add video thumbnail generation
5. Implement video streaming
6. Add user profile management
7. Add video search and filtering
8. Implement video sharing functionality

## License

ISC
