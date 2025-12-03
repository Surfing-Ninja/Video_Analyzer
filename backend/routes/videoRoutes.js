const express = require('express');
const router = express.Router();
const {
  uploadVideo,
  getVideos,
  getVideo,
  deleteVideo,
  processVideoFile,
  streamVideo,
  getAnalysisResults,
  getAnalysisStatus
} = require('../controllers/videoController');
const { authMiddleware, roleMiddleware, orgMiddleware } = require('../middleware/auth');
const upload = require('../utils/uploadConfig');

// Apply authentication and organization middleware to all routes
router.use(authMiddleware);
router.use(orgMiddleware);

// Upload video - only editors and admins can upload
router.post('/upload', roleMiddleware('editor', 'admin'), upload.single('video'), uploadVideo);

// Get all videos - all authenticated users (filtered by org)
router.get('/', getVideos);

// Stream video with Range header support - all authenticated users
router.get('/stream/:id', streamVideo);

// Get single video - all authenticated users (with role-based filtering)
router.get('/:id', getVideo);

// Get video analysis results - all authenticated users
router.get('/:id/analysis', getAnalysisResults);

// Get video analysis status - all authenticated users
router.get('/:id/analysis/status', getAnalysisStatus);

// Delete video - only editors and admins
router.delete('/:id', roleMiddleware('editor', 'admin'), deleteVideo);

// Process video - only editors and admins
router.post('/:id/process', roleMiddleware('editor', 'admin'), processVideoFile);

module.exports = router;
