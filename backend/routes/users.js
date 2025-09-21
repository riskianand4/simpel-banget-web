const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { auth, superAdminAuth } = require('../middleware/auth');
const { logAdminActivity, activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
router.get('/', superAdminAuth, activityLoggers.userAccess, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['user', 'admin', 'super_admin']),
  query('search').optional().isString(),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { department: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Static routes must be declared before parameterized routes

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private (Authenticated)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private (Authenticated)
router.put('/profile', auth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().isString(),
  body('department').optional().isString(),
  body('position').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if being updated
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
    }

    const { name, email, phone, department, position, avatar } = req.body;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (position !== undefined) user.position = position;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get available roles
// @route   GET /api/users/roles
// @access  Private (Admin)
router.get('/roles', superAdminAuth, async (req, res) => {
  try {
    const roles = [
      { value: 'user', label: 'User', description: 'Standard user access' },
      { value: 'admin', label: 'Admin', description: 'Administrative access' },
      { value: 'super_admin', label: 'Super Admin', description: 'Full system access' }
    ];

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Private (Admin)
router.get('/search', superAdminAuth, [
  query('q').notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const searchFilter = {
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { department: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    const users = await User.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(searchFilter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get user statistics overview
// @route   GET /api/users/stats/overview
// @access  Private (Admin)
router.get('/stats/overview', superAdminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const departmentStats = await User.aggregate([
      {
        $match: { department: { $ne: null, $ne: '' } }
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        roleDistribution: roleStats,
        departmentDistribution: departmentStats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin)
router.get('/:id', superAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin)
router.post('/', superAdminAuth, activityLoggers.create('user'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin', 'super_admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department, position, phone, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Only super admin can create admin users
    if ((role === 'admin' || role === 'super_admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can create admin users' });
    }

    // Create user with unverified email
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      department,
      position,
      phone,
      permissions,
      emailVerified: false
    });

    // Generate verification code
    const EmailVerification = require('../models/EmailVerification');
    const emailService = require('../services/emailService');
    
    const code = EmailVerification.generateCode();
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Create verification record
    const verification = new EmailVerification({
      email: email.toLowerCase(),
      code,
      type: 'user_creation',
      userId: user._id,
      ipAddress,
      userAgent
    });

    await verification.save();

    // Send verification email
    try {
      await emailService.sendVerificationCode(email, code, 'user_creation', name);
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully. Verification email sent.',
        requiresEmailVerification: true
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      
      // Still return success but notify about email issue
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created but failed to send verification email. Please contact admin.',
        requiresEmailVerification: true,
        emailError: true
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', superAdminAuth, activityLoggers.update('user'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['user', 'admin', 'super_admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if being updated
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
    }

    // Only super admin can update admin roles
    if (req.body.role && (req.body.role === 'admin' || req.body.role === 'super_admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can assign admin roles' });
    }

    // Prevent non-super admin from updating super admin users
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Cannot update super admin user' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:id', superAdminAuth, activityLoggers.delete('user'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the current user
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.patch('/:id/toggle-status', superAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deactivating super admin users
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Cannot modify super admin user status' });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: !user.isActive },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedUser,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/reset-password', superAdminAuth, [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only super admin can reset admin passwords
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Cannot reset super admin password' });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;