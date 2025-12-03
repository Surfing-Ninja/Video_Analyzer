const Video = require('../models/Video');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

/**
 * Video Processing Service
 * Handles video processing with real-time progress updates via Socket.io
 */

class VideoProcessingService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Process video with fake progress updates
   * Emits progress every 500ms until reaching 100%
   * @param {string} videoId - MongoDB video document ID
   * @param {string} filePath - Path to video file
   * @param {string} userId - User ID for socket room
   * @returns {Promise<Object>} Processing result
   */
  async processVideo(videoId, filePath, userId) {
    return new Promise((resolve, reject) => {
      try {
        // Update video status to processing
        Video.findByIdAndUpdate(videoId, {
          status: 'processing',
          processingProgress: 0
        }).exec();

        let progress = 0;
        const interval = 500; // 500ms intervals
        const increment = 10; // 10% per step

        // Emit initial progress
        this.emitProgress(userId, videoId, 0);

        // Simulate processing with progress updates
        const progressInterval = setInterval(async () => {
          progress += increment;

          if (progress >= 100) {
            clearInterval(progressInterval);
            
            // Randomly assign sensitivity (fake analysis)
            const sensitivity = Math.random() > 0.3 ? 'safe' : 'flagged';
            
            try {
              // Update video to completed status
              const updatedVideo = await Video.findByIdAndUpdate(
                videoId,
                {
                  status: 'processed',
                  processingProgress: 100,
                  sensitivity: sensitivity
                },
                { new: true }
              );

              // Emit completion
              this.emitProgress(userId, videoId, 100);
              this.io.to(userId).emit('processing-complete', {
                videoId,
                status: 'processed',
                sensitivity
              });

              resolve({
                success: true,
                videoId,
                sensitivity,
                message: 'Video processing completed'
              });
            } catch (error) {
              reject(error);
            }
          } else {
            // Update progress in database
            Video.findByIdAndUpdate(videoId, {
              processingProgress: progress
            }).exec();

            // Emit progress to user
            this.emitProgress(userId, videoId, progress);
          }
        }, interval);

      } catch (error) {
        // Update video to failed status
        Video.findByIdAndUpdate(videoId, {
          status: 'failed',
          processingProgress: 0
        }).exec();

        this.io.to(userId).emit('processing-error', {
          videoId,
          error: error.message
        });

        reject(error);
      }
    });
  }

  /**
   * Emit progress update to user via Socket.io
   * @param {string} userId - User ID for socket room
   * @param {string} videoId - Video ID
   * @param {number} percent - Progress percentage (0-100)
   */
  emitProgress(userId, videoId, percent) {
    this.io.to(userId).emit('processing-progress', {
      videoId,
      percent,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get video metadata using FFmpeg
   * @param {string} filePath - Path to video file
   * @returns {Promise<Object>} Video metadata
   */
  async getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            format: metadata.format.format_name,
            width: videoStream?.width || null,
            height: videoStream?.height || null,
            codec: videoStream?.codec_name || null,
            bitrate: metadata.format.bit_rate || null
          });
        }
      });
    });
  }
}

module.exports = VideoProcessingService;
