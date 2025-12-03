const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Create Express app
const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:3000',
  process.env.FRONTEND_URL // Add your Render frontend URL here
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Static files - serve uploaded videos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io middleware (will be attached in server.js)
app.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running'
  });
});

// Render health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Error handler middleware (must be last)
app.use(errorHandler);

module.exports = app;
