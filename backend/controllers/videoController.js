const Video = require('../models/Video');
const path = require('path');
const fs = require('fs');
const videoProcessorService = require('../services/videoProcessorService');

// @desc    Upload video
// @route   POST /api/videos/upload
// @access  Private
exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file'
      });
    }

    const { title, description, sensitivity, autoProcess } = req.body;

    // Validate sensitivity level
    const validSensitivity = ['public', 'internal', 'confidential', 'restricted'];
    const videoSensitivity = sensitivity && validSensitivity.includes(sensitivity) ? sensitivity : 'internal';

    // Generate URL for the video
    const videoUrl = `/uploads/${req.file.filename}`;

    // Create video record with multi-tenant support
    const video = await Video.create({
      title: title || req.file.originalname,
      description: description || '',
      userId: req.user._id,
      orgId: req.user.orgId,
      status: 'uploading',
      sensitivity: videoSensitivity,
      url: videoUrl,
      size: req.file.size,
      filename: req.file.filename,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
      originalName: req.file.originalname,
      overall: 'neutral',
      recommendedAction: 'pending'
    });

    // Emit socket event for video upload
    if (req.io) {
      req.io.to(req.user._id.toString()).emit('video:uploaded', {
        videoId: video._id,
        title: video.title
      });
    }

    // Auto-process video in background if requested (default: true)
    const shouldProcess = autoProcess !== 'false' && autoProcess !== false;
    if (shouldProcess) {
      // Start processing in background
      setImmediate(async () => {
        try {
          await videoProcessorService.processVideo(video._id, req.io, req.user._id);
        } catch (error) {
          console.error('Background processing error:', error);
        }
      });
    }

    res.status(201).json({
      success: true,
      video,
      processing: shouldProcess
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Delete uploaded file if video creation fails
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    next(error);
  }
};

// @desc    Get all videos
// @route   GET /api/videos
// @access  Private
exports.getVideos = async (req, res, next) => {
  try {
    // Multi-tenant filter: only show videos from user's organization
    const query = { orgId: req.user.orgId };

    // Optional: filter by current user if requested
    if (req.query.myVideos === 'true') {
      query.userId = req.user._id;
    }

    // Optional: filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Optional: filter by sensitivity
    if (req.query.sensitivity) {
      query.sensitivity = req.query.sensitivity;
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role');

    res.status(200).json({
      success: true,
      count: videos.length,
      videos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Private
exports.getVideo = async (req, res, next) => {
  try {
    // Multi-tenant check: only find videos within user's organization
    const video = await Video.findOne({ 
      _id: req.params.id,
      orgId: req.user.orgId 
    }).populate('userId', 'name email role');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in your organization'
      });
    }

    // Role-based access: viewers can only see their own videos
    if (req.user.role === 'viewer' && video.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this video'
      });
    }

    res.status(200).json({
      success: true,
      video
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private (Editor/Admin only)
exports.deleteVideo = async (req, res, next) => {
  try {
    // Multi-tenant check: only find videos within user's organization
    const video = await Video.findOne({ 
      _id: req.params.id,
      orgId: req.user.orgId 
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in your organization'
      });
    }

    // Role-based access control
    // Editors can delete their own videos, Admins can delete any video in the org
    if (req.user.role === 'editor' && video.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Editors can only delete their own videos'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(video.filepath)) {
      fs.unlinkSync(video.filepath);
    }

    await video.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process video (ML analysis pipeline)
// @route   POST /api/videos/:id/process
// @access  Private (Editor/Admin only)
exports.processVideoFile = async (req, res, next) => {
  try {
    // Multi-tenant check: only find videos within user's organization
    const video = await Video.findOne({ 
      _id: req.params.id,
      orgId: req.user.orgId 
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in your organization'
      });
    }

    // Role-based access: only editors and admins can process videos
    if (req.user.role === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Viewers are not authorized to process videos'
      });
    }

    // Check if already processing
    if (video.status === 'processing' || video.status === 'extracting' || 
        video.status === 'analyzing_frames' || video.status === 'transcribing') {
      return res.status(400).json({
        success: false,
        message: 'Video is already being processed'
      });
    }

    // Start processing in background
    setImmediate(async () => {
      try {
        await videoProcessorService.processVideo(video._id, req.io, req.user._id);
      } catch (error) {
        console.error('Video processing error:', error);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Video processing started',
      video
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get video analysis results
// @route   GET /api/videos/:id/analysis
// @access  Private
exports.getAnalysisResults = async (req, res, next) => {
  try {
    // Multi-tenant check
    const video = await Video.findOne({ 
      _id: req.params.id,
      orgId: req.user.orgId 
    }).select('scores timeline transcript humanDescription overall recommendedAction modelVersions status processingProgress processingStage');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in your organization'
      });
    }

    res.status(200).json({
      success: true,
      analysis: {
        status: video.status,
        progress: video.processingProgress,
        stage: video.processingStage,
        overall: video.overall,
        scores: video.scores,
        timeline: video.timeline,
        transcript: video.transcript,
        humanDescription: video.humanDescription,
        recommendedAction: video.recommendedAction,
        modelVersions: video.modelVersions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get video analysis status (lightweight)
// @route   GET /api/videos/:id/analysis/status
// @access  Private
exports.getAnalysisStatus = async (req, res, next) => {
  try {
    // Multi-tenant check
    const video = await Video.findOne({ 
      _id: req.params.id,
      orgId: req.user.orgId 
    }).select('status processingProgress processingStage overall recommendedAction');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in your organization'
      });
    }

    res.status(200).json({
      success: true,
      status: video.status,
      progress: video.processingProgress,
      stage: video.processingStage,
      overall: video.overall,
      recommendedAction: video.recommendedAction,
      isComplete: video.status === 'processed' || video.status === 'error'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get video analysis results (alias)
// @route   GET /api/videos/:id/analysis
// @access  Private
exports.getVideoAnalysis = async (req, res, next) => {
  try {
    // Multi-tenant check
    const video = await Video.findOne({ 
      _id: req.params.id,
      orgId: req.user.orgId 
    }).select('scores timeline transcript humanDescription overall recommendedAction modelVersions status processingProgress processingStage');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in your organization'
      });
    }

    res.status(200).json({
      success: true,
      analysis: {
        status: video.status,
        progress: video.processingProgress,
        stage: video.processingStage,
        overall: video.overall,
        scores: video.scores,
        timeline: video.timeline,
        transcript: video.transcript,
        humanDescription: video.humanDescription,
        recommendedAction: video.recommendedAction,
        modelVersions: video.modelVersions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get videos pending review
// @route   GET /api/videos/review-queue
// @access  Private (Admin only)
exports.getReviewQueue = async (req, res, next) => {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access the review queue'
      });
    }

    const videos = await Video.find({
      orgId: req.user.orgId,
      $or: [
        { recommendedAction: 'manual_review' },
        { overall: 'flagged' },
        { overall: 'review' }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      count: videos.length,
      videos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update video moderation decision
// @route   PUT /api/videos/:id/moderate
// @access  Private (Admin only)
exports.moderateVideo = async (req, res, next) => {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can moderate videos'
      });
    }

    const { action, reason } = req.body;
    
    const validActions = ['publish', 'age_restrict', 'remove', 'manual_review'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid moderation action'
      });
    }

    const video = await Video.findOne({
      _id: req.params.id,
      orgId: req.user.orgId
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    video.recommendedAction = action;
    
    // Update sensitivity based on action
    if (action === 'publish') {
      video.sensitivity = 'public';
      video.overall = 'safe';
    } else if (action === 'age_restrict') {
      video.sensitivity = 'internal';
      video.overall = 'neutral';
    } else if (action === 'remove') {
      video.sensitivity = 'restricted';
      video.overall = 'flagged';
    }

    // Add moderation note to description
    if (reason) {
      video.humanDescription = `[Moderated: ${reason}] ${video.humanDescription || ''}`;
    }

    await video.save();

    res.status(200).json({
      success: true,
      message: 'Video moderation updated',
      video
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stream video with Range header support
// @route   GET /api/videos/stream/:id
// @access  Private
exports.streamVideo = async (req, res, next) => {
  try {
    // Multi-tenant check: only find videos within user's organization
    const video = await Video.findOne({ 
      _id: req.params.id,
      orgId: req.user.orgId 
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in your organization'
      });
    }

    // Role-based access: viewers can only stream their own videos
    if (req.user.role === 'viewer' && video.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to stream this video'
      });
    }

    const videoPath = video.filepath;

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found on server'
      });
    }

    // Get file stats
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const mimeType = video.mimetype || 'video/mp4';

    // Parse Range header
    const range = req.headers.range;

    if (range) {
      // Parse Range header (e.g., "bytes=0-1000")
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (start >= fileSize) {
        return res.status(416).json({
          success: false,
          message: 'Requested range not satisfiable'
        });
      }

      const chunkSize = end - start + 1;

      // Create read stream for the requested range
      const stream = fs.createReadStream(videoPath, { start, end });

      // Set headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache',
      });

      // Pipe the stream to response
      stream.pipe(res);

      // Handle stream errors
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming video'
          });
        }
      });

    } else {
      // No Range header - send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      });

      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);

      // Handle stream errors
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming video'
          });
        }
      });
    }
  } catch (error) {
    next(error);
  }
};
