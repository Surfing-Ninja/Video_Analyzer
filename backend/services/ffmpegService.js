const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * FFmpeg Service for video processing
 * - Extract keyframes at specified FPS
 * - Extract audio for transcription
 * - Get video metadata (duration, resolution)
 */

class FFmpegService {
  constructor() {
    this.ffmpegPath = 'ffmpeg';
    this.ffprobePath = 'ffprobe';
  }

  /**
   * Get video metadata using ffprobe
   */
  async getVideoMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        inputPath
      ];

      const ffprobe = spawn(this.ffprobePath, args);
      let output = '';
      let errorOutput = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const metadata = JSON.parse(output);
            const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
            const audioStream = metadata.streams?.find(s => s.codec_type === 'audio');
            
            resolve({
              duration: parseFloat(metadata.format?.duration) || 0,
              width: videoStream?.width || 0,
              height: videoStream?.height || 0,
              fps: this.parseFPS(videoStream?.r_frame_rate),
              codec: videoStream?.codec_name,
              bitrate: parseInt(metadata.format?.bit_rate) || 0,
              hasAudio: !!audioStream,
              audioCodec: audioStream?.codec_name
            });
          } catch (e) {
            reject(new Error(`Failed to parse metadata: ${e.message}`));
          }
        } else {
          reject(new Error(`ffprobe failed: ${errorOutput}`));
        }
      });

      ffprobe.on('error', (err) => {
        reject(new Error(`ffprobe spawn error: ${err.message}`));
      });
    });
  }

  /**
   * Parse FPS from ffprobe format (e.g., "30/1" -> 30)
   */
  parseFPS(fpsString) {
    if (!fpsString) return 0;
    const parts = fpsString.split('/');
    if (parts.length === 2) {
      return Math.round(parseInt(parts[0]) / parseInt(parts[1]));
    }
    return parseFloat(fpsString) || 0;
  }

  /**
   * Extract keyframes from video at specified FPS
   * @param {string} inputPath - Path to input video
   * @param {string} outputDir - Directory to save frames
   * @param {number} fps - Frames per second to extract (default: 1)
   * @param {function} onProgress - Progress callback
   * @returns {Promise<string[]>} - Array of extracted frame paths
   */
  async extractFrames(inputPath, outputDir, fps = 1, onProgress = null) {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Get video duration for progress calculation
    const metadata = await this.getVideoMetadata(inputPath);
    const totalFrames = Math.ceil(metadata.duration * fps);

    return new Promise((resolve, reject) => {
      const outputPattern = path.join(outputDir, 'frame-%05d.jpg');
      
      const args = [
        '-i', inputPath,
        '-vf', `fps=${fps}`,
        '-q:v', '2', // High quality JPEG
        '-f', 'image2',
        outputPattern
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);
      let errorOutput = '';
      let frameCount = 0;

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
        
        // Parse frame progress from ffmpeg output
        const frameMatch = output.match(/frame=\s*(\d+)/);
        if (frameMatch && onProgress) {
          frameCount = parseInt(frameMatch[1]);
          const progress = Math.min((frameCount / totalFrames) * 100, 100);
          onProgress({ stage: 'extracting_frames', progress, frameCount, totalFrames });
        }
      });

      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          try {
            // Get list of extracted frames
            const files = await fs.readdir(outputDir);
            const framePaths = files
              .filter(f => f.startsWith('frame-') && f.endsWith('.jpg'))
              .sort()
              .map(f => path.join(outputDir, f));
            
            resolve(framePaths);
          } catch (e) {
            reject(new Error(`Failed to read extracted frames: ${e.message}`));
          }
        } else {
          reject(new Error(`Frame extraction failed: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`ffmpeg spawn error: ${err.message}`));
      });
    });
  }

  /**
   * Extract audio from video for transcription
   * @param {string} inputPath - Path to input video
   * @param {string} outputPath - Path for output audio file
   * @param {function} onProgress - Progress callback
   * @returns {Promise<string>} - Path to extracted audio
   */
  async extractAudio(inputPath, outputPath, onProgress = null) {
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const metadata = await this.getVideoMetadata(inputPath);
    
    if (!metadata.hasAudio) {
      console.log('Video has no audio track');
      return null;
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-vn', // No video
        '-acodec', 'pcm_s16le', // PCM format for Whisper compatibility
        '-ar', '16000', // 16kHz sample rate (optimal for Whisper)
        '-ac', '1', // Mono
        '-y', // Overwrite output
        outputPath
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);
      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
        
        // Parse time progress
        const timeMatch = output.match(/time=(\d+):(\d+):(\d+)/);
        if (timeMatch && onProgress && metadata.duration > 0) {
          const currentTime = parseInt(timeMatch[1]) * 3600 + 
                             parseInt(timeMatch[2]) * 60 + 
                             parseInt(timeMatch[3]);
          const progress = Math.min((currentTime / metadata.duration) * 100, 100);
          onProgress({ stage: 'extracting_audio', progress });
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Audio extraction failed: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`ffmpeg spawn error: ${err.message}`));
      });
    });
  }

  /**
   * Generate thumbnail at specific timestamp
   */
  async generateThumbnail(inputPath, outputPath, timestamp = 0) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      const args = [
        '-ss', timestamp.toString(),
        '-i', inputPath,
        '-vframes', '1',
        '-q:v', '2',
        '-y',
        outputPath
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);
      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Thumbnail generation failed: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`ffmpeg spawn error: ${err.message}`));
      });
    });
  }

  /**
   * Extract scene-change keyframes (more efficient for long videos)
   */
  async extractSceneFrames(inputPath, outputDir, threshold = 0.3, onProgress = null) {
    await fs.mkdir(outputDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const outputPattern = path.join(outputDir, 'scene-%05d.jpg');
      
      const args = [
        '-i', inputPath,
        '-vf', `select='gt(scene,${threshold})',showinfo`,
        '-vsync', 'vfr',
        '-q:v', '2',
        outputPattern
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);
      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          try {
            const files = await fs.readdir(outputDir);
            const framePaths = files
              .filter(f => f.startsWith('scene-') && f.endsWith('.jpg'))
              .sort()
              .map(f => path.join(outputDir, f));
            
            resolve(framePaths);
          } catch (e) {
            reject(new Error(`Failed to read scene frames: ${e.message}`));
          }
        } else {
          reject(new Error(`Scene extraction failed: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`ffmpeg spawn error: ${err.message}`));
      });
    });
  }
}

module.exports = new FFmpegService();
