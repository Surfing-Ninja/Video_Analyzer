const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an organization name'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  settings: {
    maxStorageGB: {
      type: Number,
      default: 100
    },
    allowedVideoFormats: {
      type: [String],
      default: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
    },
    maxVideoSizeMB: {
      type: Number,
      default: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

organizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);
