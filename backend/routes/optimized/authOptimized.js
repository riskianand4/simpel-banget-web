const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const { auth, superAdminAuth } = require('../../middleware/auth');
const { trackLoginAttempt } = require('../../middleware/securityMonitor');
const { cacheMiddleware, userCache } = require('../../utils/performanceCache');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Login user (OPTIMIZED)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const startTime = Date.now();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Optimized user lookup with lean() for better performance
    const user = await User.findOne({ email }).select('+password').lean();
    if (!user) {
      // Track failed login attempt
      await trackLoginAttempt(email, ipAddress, userAgent, false, null, 'invalid_email');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create User instance for password comparison
    const userInstance = new User(user);
    const isMatch = await userInstance.comparePassword(password);
    if (!isMatch) {
      // Track failed login attempt
      await trackLoginAttempt(email, ipAddress, userAgent, false, user._id, 'invalid_password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Track successful login and update last login in parallel
    await Promise.all([
      trackLoginAttempt(email, ipAddress, userAgent, true, user._id),
      User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
    ]);

    // Generate token
    const token = generateToken(user._id);

    const duration = Date.now() - startTime;
    console.log(`Login completed in ${duration}ms`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Login failed in ${duration}ms:`, error);
    res.status(500).json({ error: error.message });
  }
});

// @desc    Verify token (OPTIMIZED)
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', 
  auth,
  cacheMiddleware(userCache, (req) => `user_verify_${req.user.id}`, 30), // 30 second cache
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).lean();
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
  }
);

// @desc    Get current user (OPTIMIZED)
// @route   GET /api/auth/me
// @access  Private
router.get('/me', 
  auth,
  cacheMiddleware(userCache, (req) => `user_profile_${req.user.id}`, 60), // 1 minute cache
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).lean();
      res.json({
        success: true,
        user
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @desc    Refresh token (OPTIMIZED)
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Server error during token refresh' 
    });
  }
});

// Non-cached write operations
// @desc    Register user (SUPERADMIN ONLY)
// @route   POST /api/auth/register
// @access  Private (Super Admin)
router.post('/register', superAdminAuth, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user - SUPERADMIN ONLY: Can now specify any role
    const user = await User.create({
      name,
      email,
      password,
      role: req.body.role || 'user', // Superadmin can specify role, defaults to 'user'
      department
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
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, department, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, department, phone },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;