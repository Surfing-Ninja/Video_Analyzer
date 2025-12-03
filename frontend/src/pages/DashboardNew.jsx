import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Upload, 
  Settings, 
  LogOut, 
  Play, 
  Trash2, 
  Film,
  Cloud,
  CloudOff,
  FileVideo,
  Clock,
  HardDrive,
  Shield,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Sidebar, SidebarBody, SidebarLink } from '../components/ui/sidebar';
import { cn } from '../lib/utils';

const Dashboard = () => {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);
  
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Upload",
      href: "#",
      icon: <Upload className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Settings",
      href: "#",
      icon: <Settings className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
  ];

  // Fetch videos on mount
  useEffect(() => {
    fetchVideos();
  }, []);

  // Socket.io event listeners
  useEffect(() => {
    if (socket) {
      socket.on('video:processing:start', (data) => {
        setProcessingProgress(prev => ({ ...prev, [data.videoId]: 0 }));
      });

      socket.on('video:processing:progress', (data) => {
        setProcessingProgress(prev => ({ ...prev, [data.videoId]: data.progress }));
      });

      socket.on('video:processing:complete', (data) => {
        setProcessingProgress(prev => ({ ...prev, [data.videoId]: 100 }));
        fetchVideos();
        setSuccess(`Video processed! Sensitivity: ${data.sensitivity}`);
        setTimeout(() => setSuccess(''), 5000);
      });

      socket.on('video:processing:error', (data) => {
        setError(`Processing failed: ${data.error}`);
        fetchVideos();
      });

      socket.on('video:uploaded', () => {
        fetchVideos();
      });

      socket.on('videoProcessingProgress', (data) => {
        setProcessingProgress(prev => ({ ...prev, [data.videoId]: data.progress }));
      });

      socket.on('videoProcessingComplete', () => {
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

    try {
      const res = await axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        }
      });

      if (res.data.success) {
        setSuccess('Video uploaded successfully!');
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

  return (
    <div className={cn(
      "flex flex-col md:flex-row bg-neutral-950 w-full min-h-screen"
    )}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 border-r border-neutral-800">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 py-2">
              <div className="h-8 w-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Film className="h-5 w-5 text-white" />
              </div>
              <motion.span
                animate={{
                  display: sidebarOpen ? "inline-block" : "none",
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="font-bold text-xl text-white whitespace-pre"
              >
                VideoAnalyzer
              </motion.span>
            </div>

            {/* Connection Status */}
            <motion.div
              animate={{
                display: sidebarOpen ? "flex" : "none",
                opacity: sidebarOpen ? 1 : 0,
              }}
              className="mt-4 px-2 py-2 rounded-lg bg-neutral-800/50 items-center gap-2"
            >
              {connected ? (
                <Cloud className="h-4 w-4 text-green-400" />
              ) : (
                <CloudOff className="h-4 w-4 text-red-400" />
              )}
              <span className={cn(
                "text-xs",
                connected ? "text-green-400" : "text-red-400"
              )}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </motion.div>

            {/* Navigation Links */}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex flex-col gap-2">
            <SidebarLink
              link={{
                label: user?.name || 'User',
                href: "#",
                icon: (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                ),
              }}
            />
            <div className="px-2">
              <motion.span
                animate={{
                  display: sidebarOpen ? "inline-block" : "none",
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className={cn(
                  "text-xs px-2 py-1 rounded-full capitalize",
                  user?.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                  user?.role === 'editor' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-neutral-500/20 text-neutral-400'
                )}
              >
                {user?.role}
              </motion.span>
            </div>
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: <LogOut className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
              }}
              onClick={logout}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-neutral-400 mt-1">Manage and analyze your videos</p>
          </div>

          {/* Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400"
            >
              {success}
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-500/10 rounded-xl">
                  <FileVideo className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Total Videos</p>
                  <p className="text-2xl font-bold text-white">{videos.length}</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Play className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {videos.filter(v => v.status === 'completed').length}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Processing</p>
                  <p className="text-2xl font-bold text-white">
                    {videos.filter(v => v.status === 'processing').length}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                  <HardDrive className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Storage Used</p>
                  <p className="text-2xl font-bold text-white">
                    {formatFileSize(videos.reduce((acc, v) => acc + (v.size || 0), 0))}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Upload Section */}
          {(user?.role === 'admin' || user?.role === 'editor') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Upload Video</h2>
              <div
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300",
                  uploading 
                    ? "border-violet-500 bg-violet-500/5" 
                    : "border-neutral-700 hover:border-violet-500/50 hover:bg-neutral-900/50"
                )}
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
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#374151"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="3"
                          strokeDasharray={`${uploadProgress}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                        {uploadProgress}%
                      </span>
                    </div>
                    <p className="text-neutral-400">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-violet-400" />
                    </div>
                    <p className="text-white font-medium mb-2">Drag & drop a video here</p>
                    <p className="text-neutral-500 text-sm">or click to browse</p>
                    <p className="text-neutral-600 text-xs mt-2">MP4, MOV, AVI, MKV (Max 100MB)</p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Videos Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Videos</h2>
              <span className="text-neutral-500 text-sm">{videos.length} videos</span>
            </div>

            {videos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-neutral-800 flex items-center justify-center">
                  <Film className="h-10 w-10 text-neutral-600" />
                </div>
                <p className="text-white font-medium mb-2">No videos uploaded yet</p>
                <p className="text-neutral-500 text-sm">Upload your first video to get started</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video, index) => (
                  <motion.div
                    key={video._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden group hover:border-neutral-700 transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    <div 
                      className="aspect-video bg-neutral-800 relative cursor-pointer overflow-hidden"
                      onClick={() => playVideo(video._id)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-violet-500 transition-all duration-300">
                          <Play className="h-6 w-6 text-white ml-1" />
                        </div>
                      </div>
                      
                      {/* Processing Progress Overlay */}
                      {processingProgress[video._id] !== undefined && 
                        processingProgress[video._id] < 100 && 
                        video.status === 'processing' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700">
                          <div 
                            className="h-full bg-violet-500 transition-all duration-300"
                            style={{ width: `${processingProgress[video._id]}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-white font-medium truncate mb-3" title={video.title}>
                        {video.originalName || video.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full uppercase font-medium",
                          getStatusColor(video.status)
                        )}>
                          {video.status}
                        </span>
                        {video.sensitivity && (
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full uppercase font-medium border",
                            getSensitivityColor(video.sensitivity)
                          )}>
                            <Shield className="h-3 w-3 inline mr-1" />
                            {video.sensitivity}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-neutral-500 text-xs mb-4">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(video.size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(video.createdAt)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => playVideo(video._id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors"
                        >
                          <Play className="h-4 w-4" />
                          Play
                        </button>
                        {(user?.role === 'admin' || user?.role === 'editor') && (
                          <button
                            onClick={() => deleteVideo(video._id)}
                            className="p-2.5 bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-xl transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
