const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication Middleware
exports.authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Also check query parameter (for video streaming)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please provide a valid token.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token with orgId
      req.user = await User.findById(decoded.id).select('+orgId');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Role-Based Access Control Middleware
exports.roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// Multi-tenant check middleware - ensures queries are scoped to user's organization
exports.orgMiddleware = (req, res, next) => {
  if (!req.user || !req.user.orgId) {
    return res.status(403).json({
      success: false,
      message: 'Organization context required'
    });
  }
  
  // Attach orgId to request for use in queries
  req.orgId = req.user.orgId;
  next();
};

// Legacy aliases for backward compatibility
exports.protect = exports.authMiddleware;
exports.authorize = exports.roleMiddleware;
