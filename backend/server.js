const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user authentication and room joining
  socket.on('authenticate', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} authenticated and joined their room`);
      socket.emit('authenticated', { userId, socketId: socket.id });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Custom room management
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
    socket.emit('room-joined', { room });
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`Client ${socket.id} left room: ${room}`);
    socket.emit('room-left', { room });
  });

  // Ping-pong for connection health check
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
});

// Make io accessible to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
