const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const mongoose = require('mongoose');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, orgId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Use provided orgId or generate a default one for testing
    const userOrgId = orgId || new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    // Check if user exists in the same organization
    const userExists = await User.findOne({ email, orgId: userOrgId });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists in the organization'
      });
    }

    // Validate role if provided
    const validRoles = ['viewer', 'editor', 'admin'];
    const userRole = role && validRoles.includes(role) ? role : 'viewer';

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      orgId: userOrgId
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, orgId } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Use provided orgId or default one for testing
    const userOrgId = orgId || new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    // Check for user in the specific organization
    const user = await User.findOne({ email, orgId: userOrgId }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      }
    });
  } catch (error) {
    next(error);
  }
};
