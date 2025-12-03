import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const videoRef = useRef(null);
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVideoMetadata();
  }, [id]);

  const fetchVideoMetadata = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/videos/${id}`);
      setVideo(res.data.video);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const getStreamUrl = () => {
    return `http://localhost:5001/api/videos/stream/${id}?token=${token}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="player-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="player-page">
        <div className="error-container">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page">
      {/* Header */}
      <header className="player-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>{video?.originalName || video?.title || 'Video Player'}</h1>
      </header>

      {/* Video Container */}
      <div className="video-container">
        <video
          ref={videoRef}
          controls
          autoPlay
          className="video-player"
          src={getStreamUrl()}
          onError={(e) => {
            console.error('Video error:', e);
            setError('Failed to load video stream');
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Video Info */}
      <div className="video-details">
        <div className="video-title-section">
          <h2>{video?.originalName || video?.title}</h2>
          <div className="video-badges">
            <span className={`badge status-${video?.status}`}>
              {video?.status}
            </span>
            {video?.sensitivity && (
              <span className={`badge sensitivity-${video?.sensitivity}`}>
                {video?.sensitivity}
              </span>
            )}
          </div>
        </div>

        <div className="video-meta-grid">
          <div className="meta-item">
            <span className="meta-label">File Size</span>
            <span className="meta-value">{formatFileSize(video?.size)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Duration</span>
            <span className="meta-value">{formatDuration(video?.duration)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Format</span>
            <span className="meta-value">{video?.mimetype || 'video/mp4'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Uploaded</span>
            <span className="meta-value">{formatDate(video?.createdAt)}</span>
          </div>
          {video?.resolution?.width && (
            <div className="meta-item">
              <span className="meta-label">Resolution</span>
              <span className="meta-value">
                {video.resolution.width} x {video.resolution.height}
              </span>
            </div>
          )}
          {video?.description && (
            <div className="meta-item full-width">
              <span className="meta-label">Description</span>
              <span className="meta-value">{video.description}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
