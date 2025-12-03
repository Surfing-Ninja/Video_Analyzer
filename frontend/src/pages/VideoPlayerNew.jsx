import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Play, 
  HardDrive, 
  Clock, 
  FileVideo, 
  Calendar,
  Monitor,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

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

  const getSensitivityColor = (sensitivity) => {
    const colors = {
      public: 'bg-green-500/20 text-green-400 border-green-500/30',
      internal: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      confidential: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      restricted: 'bg-red-500/20 text-red-400 border-red-500/30',
      safe: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      flagged: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };
    return colors[sensitivity] || 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
  };

  const getStatusColor = (status) => {
    const colors = {
      uploading: 'bg-blue-500/20 text-blue-400',
      processing: 'bg-purple-500/20 text-purple-400',
      processed: 'bg-cyan-500/20 text-cyan-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-neutral-500/20 text-neutral-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Video</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-300" />
          </button>
          <h1 className="text-lg font-semibold text-white truncate">
            {video?.originalName || video?.title || 'Video Player'}
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl"
        >
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full aspect-video"
            src={getStreamUrl()}
            onError={(e) => {
              console.error('Video error:', e);
              setError('Failed to load video stream');
            }}
          >
            Your browser does not support the video tag.
          </video>
        </motion.div>

        {/* Video Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
        >
          {/* Title & Badges */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-3">
              {video?.originalName || video?.title}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className={cn(
                "text-xs px-3 py-1.5 rounded-full uppercase font-medium",
                getStatusColor(video?.status)
              )}>
                {video?.status}
              </span>
              {video?.sensitivity && (
                <span className={cn(
                  "text-xs px-3 py-1.5 rounded-full uppercase font-medium border flex items-center gap-1",
                  getSensitivityColor(video?.sensitivity)
                )}>
                  <Shield className="w-3 h-3" />
                  {video?.sensitivity}
                </span>
              )}
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <HardDrive className="w-4 h-4" />
                File Size
              </div>
              <p className="text-white font-semibold">{formatFileSize(video?.size)}</p>
            </div>
            
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Duration
              </div>
              <p className="text-white font-semibold">{formatDuration(video?.duration)}</p>
            </div>
            
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <FileVideo className="w-4 h-4" />
                Format
              </div>
              <p className="text-white font-semibold">{video?.mimetype || 'video/mp4'}</p>
            </div>
            
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Uploaded
              </div>
              <p className="text-white font-semibold text-sm">{formatDate(video?.createdAt)}</p>
            </div>

            {video?.resolution?.width && (
              <div className="bg-neutral-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                  <Monitor className="w-4 h-4" />
                  Resolution
                </div>
                <p className="text-white font-semibold">
                  {video.resolution.width} x {video.resolution.height}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {video?.description && (
            <div className="mt-6 pt-6 border-t border-neutral-800">
              <h3 className="text-sm font-medium text-neutral-400 mb-2">Description</h3>
              <p className="text-neutral-300">{video.description}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default VideoPlayer;
