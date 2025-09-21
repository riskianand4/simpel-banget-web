const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../../models/User');
const { auth, superAdminAuth } = require('../../middleware/auth');
const { cacheMiddleware, userCache, staticCache, CACHE_KEYS, batchDatabaseOperations } = require('../../utils/performanceCache');

const router = express.Router();

// @desc    Get all users (OPTIMIZED)
// @route   GET /api/users
// @access  Private (Admin)
router.get('/', 
  superAdminAuth, 
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['user', 'admin', 'super_admin']),
    query('search').optional().isString(),
    query('isActive').optional().isBoolean()
  ],
  cacheMiddleware(userCache, (req) => `users_p${req.query.page || 1}_l${req.query.limit || 20}_r${req.query.role || 'all'}_s${req.query.search || ''}_a${req.query.isActive || 'all'}`, 60),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
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

      // Use aggregation for better performance
      const [users, total] = await batchDatabaseOperations([
        User.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(filter)
      ]);

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
  }
);

// @desc    Get available roles (OPTIMIZED - STATIC CACHE)
// @route   GET /api/users/roles
// @access  Private (Admin)
router.get('/roles', 
  superAdminAuth, 
  cacheMiddleware(staticCache, CACHE_KEYS.USER_ROLES, 3600), // 1 hour cache
  async (req, res) => {
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
  }
);

// @desc    Get user statistics overview (OPTIMIZED)
// @route   GET /api/users/stats/overview
// @access  Private (Admin)
router.get('/stats/overview', 
  superAdminAuth,
  cacheMiddleware(userCache, CACHE_KEYS.USER_STATS, 300), // 5 minute cache
  async (req, res) => {
    try {
      // Use aggregation pipeline for efficient stats calculation
      const [userStats, roleStats, departmentStats] = await batchDatabaseOperations([
        User.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
              inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } }
            }
          }
        ]),
        User.aggregate([
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 }
            }
          }
        ]),
        User.aggregate([
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
        ])
      ]);

      const stats = userStats[0] || { total: 0, active: 0, inactive: 0 };

      res.json({
        success: true,
        data: {
          total: stats.total,
          active: stats.active,
          inactive: stats.inactive,
          roleDistribution: roleStats,
          departmentDistribution: departmentStats
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @desc    Search users (OPTIMIZED)
// @route   GET /api/users/search
// @access  Private (Admin)
router.get('/search', 
  superAdminAuth, 
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  cacheMiddleware(userCache, (req) => `user_search_${req.query.q}_p${req.query.page || 1}_l${req.query.limit || 20}`, 120),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const searchQuery = req.query.q;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const searchFilter = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { department: { $regex: searchQuery, $options: 'i' } }
        ]
      };

      const [users, total] = await batchDatabaseOperations([
        User.find(searchFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(searchFilter)
      ]);

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
  }
);

// Non-cached routes (write operations)
// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private (Authenticated)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

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

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin)
router.get('/:id', superAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();

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

module.exports = router;