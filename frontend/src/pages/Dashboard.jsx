import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Dashboard.css';

const Dashboard = () => {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState({});
  const [processingStage, setProcessingStage] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const fileInputRef = useRef(null);
  
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  // Fetch videos on mount
  useEffect(() => {
    fetchVideos();
  }, []);

  // Socket.io event listeners
  useEffect(() => {
    if (socket) {
      // Listen for processing progress
      socket.on('video:processing:start', (data) => {
        console.log('Processing started:', data);
        setProcessingProgress(prev => ({ ...prev, [data.videoId]: 0 }));
      });

      socket.on('video:processing:progress', (data) => {
        console.log('Processing progress:', data);
        setProcessingProgress(prev => ({ ...prev, [data.videoId]: data.progress }));
        setProcessingStage(prev => ({ ...prev, [data.videoId]: data.message || data.stage }));
      });

      socket.on('video:processing:complete', (data) => {
        console.log('Processing complete:', data);
        setProcessingProgress(prev => ({ ...prev, [data.videoId]: 100 }));
        setProcessingStage(prev => ({ ...prev, [data.videoId]: 'completed' }));
        fetchVideos();
        
        // Show result notification
        const actionLabels = {
          'publish': '✅ Safe to publish',
          'age_restrict': '⚠️ Age restriction recommended',
          'manual_review': '🔍 Manual review needed',
          'remove': '🚫 Content violation detected'
        };
        setSuccess(`Video analyzed! ${actionLabels[data.recommendedAction] || data.overall}`);
        setTimeout(() => setSuccess(''), 5000);
      });

      socket.on('video:processing:error', (data) => {
        console.log('Processing error:', data);
        setError(`Processing failed: ${data.error}`);
        setProcessingStage(prev => ({ ...prev, [data.videoId]: 'failed' }));
        fetchVideos();
      });

      socket.on('video:uploaded', (data) => {
        console.log('Video uploaded:', data);
        fetchVideos();
      });

      // Legacy event names for compatibility
      socket.on('videoProcessingProgress', (data) => {
        setProcessingProgress(prev => ({ ...prev, [data.videoId]: data.progress }));
      });

      socket.on('videoProcessingComplete', (data) => {
        setProcessingProgress(prev => ({ ...prev, [data.videoId]: 100 }));
        fetchVideos();
      });

      return () => {
        socket.off('video:processing:start');
        socket.off('video:processing:progress');
        socket.off('video:processing:complete');
        socket.off('video:processing:error');
        socket.off('video:uploaded');
        socket.off('videoProcessingProgress');
        socket.off('videoProcessingComplete');
      };
    }
  }, [socket]);

  const fetchVideos = async () => {
    try {
      const res = await axios.get('/api/videos');
      setVideos(res.data.videos || []);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      setError('Failed to load videos');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadVideo(file);
    }
  };

  const uploadVideo = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name);
    formData.append('autoProcess', 'true');

    try {
      const res = await axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (res.data.success) {
        setSuccess('Video uploaded! Analysis starting...');
        setTimeout(() => setSuccess(''), 3000);
        fetchVideos();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      uploadVideo(file);
    } else {
      setError('Please drop a valid video file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const deleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await axios.delete(`/api/videos/${videoId}`);
      setSuccess('Video deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchVideos();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete video');
    }
  };

  const playVideo = (videoId) => {
    navigate(`/player/${videoId}`);
  };

  const viewAnalysis = (video) => {
    setSelectedVideo(video);
  };

  const closeAnalysis = () => {
    setSelectedVideo(null);
  };

  const reprocessVideo = async (videoId) => {
    try {
      await axios.post(`/api/videos/${videoId}/process`);
      setSuccess('Reprocessing started...');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reprocess');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOverallBadge = (video) => {
    const labels = {
      'safe': { icon: '✅', color: 'green', text: 'Safe' },
      'neutral': { icon: '⚪', color: 'gray', text: 'Neutral' },
      'review': { icon: '🔍', color: 'orange', text: 'Review' },
      'flagged': { icon: '🚫', color: 'red', text: 'Flagged' }
    };
    return labels[video.overall] || labels.neutral;
  };

  const getActionBadge = (action) => {
    const labels = {
      'publish': { icon: '✅', color: 'green', text: 'Publish' },
      'age_restrict': { icon: '🔞', color: 'orange', text: 'Age Restrict' },
      'manual_review': { icon: '👁️', color: 'yellow', text: 'Review' },
      'remove': { icon: '🚫', color: 'red', text: 'Remove' },
      'pending': { icon: '⏳', color: 'gray', text: 'Pending' }
    };
    return labels[action] || labels.pending;
  };

  const ScoreBar = ({ label, value, color }) => (
    <div className="score-bar">
      <div className="score-label">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="score-track">
        <div 
          className="score-fill" 
          style={{ 
            width: `${value * 100}%`,
            backgroundColor: color || (value > 0.7 ? '#ef4444' : value > 0.4 ? '#f59e0b' : '#22c55e')
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎬 Video Analyzer</h1>
          <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Live' : '○ Offline'}
          </span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className={`user-role ${user?.role}`}>{user?.role}</span>
          </div>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Messages */}
      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      {/* Upload Section */}
      <section className="upload-section">
        <h2>Upload Video</h2>
        <div
          className={`upload-zone ${uploading ? 'uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            hidden
          />
          {uploading ? (
            <div className="upload-progress">
              <div className="progress-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle-progress"
                    strokeDasharray={`${uploadProgress}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span>{uploadProgress}%</span>
              </div>
              <p>Uploading...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📤</div>
              <p>Drag & drop a video here or click to browse</p>
              <small>Supported: MP4, MOV, AVI, MKV (Max 100MB)</small>
            </>
          )}
        </div>
      </section>

      {/* Videos Section */}
      <section className="videos-section">
        <div className="section-header">
          <h2>Your Videos</h2>
          <span className="video-count">{videos.length} videos</span>
        </div>

        {videos.length === 0 ? (
          <div className="no-videos">
            <div className="empty-icon">🎥</div>
            <p>No videos uploaded yet</p>
            <small>Upload your first video to get started</small>
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map((video) => {
              const overall = getOverallBadge(video);
              const action = getActionBadge(video.recommendedAction);
              const isProcessing = video.status === 'processing' || 
                                   video.status === 'extracting' || 
                                   video.status === 'analyzing_frames' ||
                                   video.status === 'transcribing' ||
                                   video.status === 'analyzing_text' ||
                                   video.status === 'summarizing';
              const progress = processingProgress[video._id] ?? video.processingProgress ?? 0;
              const stage = processingStage[video._id] || video.processingStage || video.status;
              
              return (
                <div key={video._id} className={`video-card ${isProcessing ? 'processing' : ''}`}>
                  <div className="video-thumbnail" onClick={() => playVideo(video._id)}>
                    <div className="play-overlay">▶</div>
                    {video.overall && video.status === 'completed' && (
                      <div className={`overall-indicator ${video.overall}`}>
                        {overall.icon}
                      </div>
                    )}
                  </div>
                  
                  <div className="video-info">
                    <h3 className="video-title" title={video.title}>
                      {video.originalName || video.title}
                    </h3>
                    
                    <div className="video-badges">
                      <span className={`badge status-${video.status}`}>
                        {video.status}
                      </span>
                      {video.overall && video.status === 'completed' && (
                        <span className={`badge overall-${video.overall}`} style={{ backgroundColor: overall.color === 'green' ? '#22c55e' : overall.color === 'red' ? '#ef4444' : overall.color === 'orange' ? '#f59e0b' : '#6b7280' }}>
                          {overall.icon} {overall.text}
                        </span>
                      )}
                      {video.recommendedAction && video.recommendedAction !== 'pending' && (
                        <span className={`badge action-${video.recommendedAction}`}>
                          {action.icon} {action.text}
                        </span>
                      )}
                    </div>

                    {/* Processing Progress Bar */}
                    {isProcessing && (
                      <div className="processing-info">
                        <div className="processing-bar">
                          <div 
                            className="processing-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="processing-text">
                          <span className="stage">{stage}</span>
                          <span className="percent">{progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Reason for flagged videos */}
                    {video.status === 'completed' && (video.overall === 'flagged' || video.overall === 'review') && video.scores && (
                      <div className="flagged-reason">
                        <span className="reason-label">⚠️ Flagged for:</span>
                        <span className="reason-text">
                          {(() => {
                            const reasons = [];
                            if ((video.scores.nudity || 0) > 0.3) reasons.push(`Nudity (${Math.round(video.scores.nudity * 100)}%)`);
                            if ((video.scores.violence || 0) > 0.3) reasons.push(`Violence (${Math.round(video.scores.violence * 100)}%)`);
                            if ((video.scores.sexual_content || 0) > 0.3) reasons.push(`Sexual Content (${Math.round(video.scores.sexual_content * 100)}%)`);
                            if ((video.scores.hate_speech || 0) > 0.2) reasons.push(`Hate Speech (${Math.round(video.scores.hate_speech * 100)}%)`);
                            if ((video.scores.profanity || 0) > 0.3) reasons.push(`Profanity (${Math.round(video.scores.profanity * 100)}%)`);
                            if ((video.scores.weapons || 0) > 0.3) reasons.push(`Weapons (${Math.round(video.scores.weapons * 100)}%)`);
                            if ((video.scores.drug_use || 0) > 0.3) reasons.push(`Drug Use (${Math.round(video.scores.drug_use * 100)}%)`);
                            return reasons.length > 0 ? reasons.join(', ') : 'Content requires review';
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Quick Scores Preview for completed videos */}
                    {video.status === 'completed' && video.scores && (
                      <div className="quick-scores">
                        {Object.entries(video.scores)
                          .filter(([key, value]) => value > 0.05 && key !== 'overall_confidence')
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <div key={key} className="mini-score">
                              <span className="mini-label">{key.replace(/_/g, ' ')}</span>
                              <div className="mini-bar">
                                <div 
                                  className="mini-fill"
                                  style={{ 
                                    width: `${value * 100}%`,
                                    backgroundColor: value > 0.7 ? '#ef4444' : value > 0.4 ? '#f59e0b' : '#22c55e'
                                  }}
                                />
                              </div>
                              <span className="mini-value">{Math.round(value * 100)}%</span>
                            </div>
                          ))}
                        {Object.entries(video.scores).filter(([key, value]) => value > 0.05 && key !== 'overall_confidence').length === 0 && (
                          <div className="no-flags">✅ No concerning content detected</div>
                        )}
                      </div>
                    )}

                    <div className="video-meta">
                      <span>{formatFileSize(video.size)}</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>

                    <div className="video-actions">
                      <button 
                        className="btn-play"
                        onClick={() => playVideo(video._id)}
                      >
                        ▶ Play
                      </button>
                      {video.status === 'completed' && (
                        <button 
                          className="btn-analysis"
                          onClick={() => viewAnalysis(video)}
                        >
                          📊 Analysis
                        </button>
                      )}
                      {(user?.role === 'admin' || user?.role === 'editor') && (
                        <>
                          {video.status !== 'processing' && (
                            <button 
                              className="btn-reprocess"
                              onClick={() => reprocessVideo(video._id)}
                              title="Reprocess video"
                            >
                              🔄
                            </button>
                          )}
                          <button 
                            className="btn-delete"
                            onClick={() => deleteVideo(video._id)}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Analysis Modal */}
      {selectedVideo && (
        <div className="analysis-modal-overlay" onClick={closeAnalysis}>
          <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Analysis Results</h2>
              <button className="close-btn" onClick={closeAnalysis}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="video-summary">
                <h3>{selectedVideo.originalName || selectedVideo.title}</h3>
                <div className="summary-badges">
                  <span className={`badge overall-${selectedVideo.overall}`}>
                    {getOverallBadge(selectedVideo).icon} {selectedVideo.overall?.toUpperCase()}
                  </span>
                  <span className={`badge action-${selectedVideo.recommendedAction}`}>
                    {getActionBadge(selectedVideo.recommendedAction).icon} {selectedVideo.recommendedAction?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedVideo.humanDescription && (
                <div className="human-description detailed-report">
                  <h4>🤖 AI Analysis Report</h4>
                  <div className="report-content">
                    {selectedVideo.humanDescription.split('\n').map((line, idx) => {
                      // Handle bold text
                      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      
                      // Skip empty lines but add spacing
                      if (!line.trim()) return <div key={idx} className="report-spacer" />;
                      
                      // Detect headers (lines starting with emoji or containing **)
                      const isHeader = line.includes('**') && (line.startsWith('📊') || line.startsWith('⏱️') || line.startsWith('🎬') || line.startsWith('🔍') || line.startsWith('🎤') || line.startsWith('💡') || line.startsWith('✅') || line.startsWith('🔞') || line.startsWith('👁️') || line.startsWith('🚫') || line.startsWith('📈') || line.startsWith('📹') || line.startsWith('🏷️'));
                      
                      // Detect bullet points
                      const isBullet = line.trim().startsWith('•');
                      
                      if (isHeader) {
                        return <div key={idx} className="report-header" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                      }
                      
                      if (isBullet) {
                        return <div key={idx} className="report-bullet" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                      }
                      
                      return <div key={idx} className="report-line" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                    })}
                  </div>
                </div>
              )}

              {selectedVideo.scores && (
                <div className="scores-section">
                  <h4>📈 Content Scores</h4>
                  <div className="scores-grid">
                    <ScoreBar label="🔞 Nudity" value={selectedVideo.scores.nudity || 0} />
                    <ScoreBar label="⚔️ Violence" value={selectedVideo.scores.violence || 0} />
                    <ScoreBar label="🤬 Profanity" value={selectedVideo.scores.profanity || 0} />
                    <ScoreBar label="😠 Hate Speech" value={selectedVideo.scores.hate_speech || 0} />
                    <ScoreBar label="💋 Sexual Content" value={selectedVideo.scores.sexual_content || 0} />
                    <ScoreBar label="💊 Drug Use" value={selectedVideo.scores.drug_use || 0} />
                    <ScoreBar label="🔫 Weapons" value={selectedVideo.scores.weapons || 0} />
                  </div>
                  <div className="confidence">
                    Confidence: {Math.round((selectedVideo.scores.overall_confidence || 0) * 100)}%
                  </div>
                </div>
              )}

              {selectedVideo.timeline && selectedVideo.timeline.length > 0 && (
                <div className="timeline-section">
                  <h4>⏱️ Flagged Moments ({selectedVideo.timeline.length})</h4>
                  <div className="timeline-list">
                    {selectedVideo.timeline.slice(0, 10).map((event, idx) => (
                      <div key={idx} className="timeline-event">
                        <span className="time">{Math.floor(event.start / 60)}:{String(Math.floor(event.start % 60)).padStart(2, '0')}</span>
                        <span className={`category ${event.category}`}>{event.category}</span>
                        <span className="score">{Math.round(event.score * 100)}%</span>
                        {event.note && <span className="note">{event.note}</span>}
                      </div>
                    ))}
                    {selectedVideo.timeline.length > 10 && (
                      <div className="more-events">
                        +{selectedVideo.timeline.length - 10} more events
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedVideo.transcript && selectedVideo.transcript.length > 0 && (
                <div className="transcript-section">
                  <h4>📝 Flagged Transcript Segments</h4>
                  <div className="transcript-list">
                    {selectedVideo.transcript.filter(t => t.flagged).slice(0, 5).map((seg, idx) => (
                      <div key={idx} className="transcript-segment flagged">
                        <span className="time">{Math.floor(seg.time / 60)}:{String(Math.floor(seg.time % 60)).padStart(2, '0')}</span>
                        <span className="text">{seg.text}</span>
                        {seg.category && <span className="category">{seg.category}</span>}
                      </div>
                    ))}
                    {selectedVideo.transcript.filter(t => t.flagged).length === 0 && (
                      <p className="no-flags">No flagged segments in transcript</p>
                    )}
                  </div>
                </div>
              )}

              {selectedVideo.modelVersions && (
                <div className="model-versions">
                  <h4>🔧 Model Versions</h4>
                  <div className="versions-grid">
                    {selectedVideo.modelVersions.vision && <span>Vision: {selectedVideo.modelVersions.vision}</span>}
                    {selectedVideo.modelVersions.asr && <span>ASR: {selectedVideo.modelVersions.asr}</span>}
                    {selectedVideo.modelVersions.text_analysis && <span>Text: {selectedVideo.modelVersions.text_analysis}</span>}
                    {selectedVideo.modelVersions.llm && <span>LLM: {selectedVideo.modelVersions.llm}</span>}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-play" onClick={() => { closeAnalysis(); playVideo(selectedVideo._id); }}>
                ▶ Play Video
              </button>
              <button className="btn-close" onClick={closeAnalysis}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
