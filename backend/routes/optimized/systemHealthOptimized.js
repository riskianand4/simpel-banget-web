const express = require('express');
const SystemHealth = require('../../models/SystemHealth');
const AdminActivity = require('../../models/AdminActivity');
const User = require('../../models/User');
const Product = require('../../models/Product');
const { superAdminAuth } = require('../../middleware/auth');
const { cacheMiddleware, systemCache, CACHE_KEYS, batchDatabaseOperations } = require('../../utils/performanceCache');
const mongoose = require('mongoose');

const router = express.Router();

// @desc    Get system metrics for dashboard (OPTIMIZED)
// @route   GET /api/system/metrics
// @access  Super Admin
router.get('/metrics', 
  superAdminAuth, 
  cacheMiddleware(systemCache, CACHE_KEYS.SYSTEM_METRICS, 15), // 15 second cache
  async (req, res) => {
    try {
      // Batch all database operations
      const [users, products, latestHealth] = await batchDatabaseOperations([
        User.find({}).lean().select('role isActive'),
        Product.find({}).lean().select('quantity minStock'),
        SystemHealth.findOne().sort({ timestamp: -1 }).lean()
      ]);

      // Process data efficiently
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.isActive === true).length;
      const admins = users.filter(u => u.role === 'super_admin').length;
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => p.quantity <= (p.minStock || 10)).length;

      const systemHealth = latestHealth || {
        metrics: {
          uptime: process.uptime(),
          memoryUsage: { percentage: '0%' },
          database: { status: 'healthy' }
        },
        status: 'excellent'
      };

      const metrics = [
        {
          label: 'Total Users',
          value: totalUsers.toString(),
          icon: 'Users',
          trend: `${activeUsers} active`,
          status: totalUsers > 0 ? 'good' : 'warning'
        },
        {
          label: 'System Load',
          value: systemHealth.metrics.memoryUsage.percentage,
          icon: 'Server',
          trend: 'stable',
          status: systemHealth.status
        },
        {
          label: 'Security Alerts',
          value: '0',
          icon: 'AlertTriangle',
          trend: 'none',
          status: 'excellent'
        },
        {
          label: 'Database Status',
          value: systemHealth.metrics.database.status === 'healthy' ? 'Online' : 'Offline',
          icon: 'Database',
          trend: 'stable',
          status: systemHealth.metrics.database.status === 'healthy' ? 'excellent' : 'critical'
        },
        {
          label: 'Active Admins',
          value: admins.toString(),
          icon: 'Shield',
          trend: `${admins} online`,
          status: admins > 0 ? 'good' : 'warning'
        },
        {
          label: 'System Uptime',
          value: Math.floor(systemHealth.metrics.uptime / 3600) + 'h',
          icon: 'Globe',
          trend: 'stable',
          status: 'excellent'
        }
      ];

      res.json({
        success: true,
        data: {
          metrics,
          systemHealth: systemHealth.metrics,
          userStats: { totalUsers, activeUsers, admins },
          productStats: { totalProducts, lowStockProducts }
        }
      });
    } catch (error) {
      console.error('Optimized metrics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// @desc    Get admin activities (OPTIMIZED)
// @route   GET /api/system/activities
// @access  Super Admin
router.get('/activities', 
  superAdminAuth,
  cacheMiddleware(systemCache, (req) => `${CACHE_KEYS.ADMIN_ACTIVITIES}_p${req.query.page || 1}_l${req.query.limit || 100}`, 60),
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 100, 100); // Cap at 100
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (req.query.admin && req.query.admin !== 'all') {
        filter.admin = req.query.admin;
      }
      if (req.query.risk && req.query.risk !== 'all') {
        filter.risk = req.query.risk;
      }
      if (req.query.action) {
        filter.action = { $regex: req.query.action, $options: 'i' };
      }
      if (req.query.startDate && req.query.endDate) {
        filter.timestamp = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
        };
      }

      // Use aggregation for better performance
      const [activities, totalCount] = await batchDatabaseOperations([
        AdminActivity.aggregate([
          { $match: filter },
          { $sort: { timestamp: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'adminId',
              foreignField: '_id',
              as: 'adminData',
              pipeline: [{ $project: { name: 1, email: 1 } }]
            }
          },
          {
            $addFields: {
              adminId: { $arrayElemAt: ['$adminData', 0] }
            }
          },
          { $unset: 'adminData' }
        ]),
        AdminActivity.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: activities,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error('Optimized activities error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// @desc    Get system alerts (OPTIMIZED)
// @route   GET /api/system/alerts
// @access  Super Admin
router.get('/alerts', 
  superAdminAuth,
  cacheMiddleware(systemCache, CACHE_KEYS.SYSTEM_ALERTS, 30),
  async (req, res) => {
    try {
      const recentHealth = await SystemHealth.find({
        status: { $in: ['warning', 'critical'] },
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

      const alerts = recentHealth.length > 0 
        ? recentHealth.map(health => ({
            message: `System ${health.status} - Memory usage: ${health.metrics.memoryUsage.percentage}`,
            severity: health.status === 'critical' ? 'critical' : 'warning',
            time: health.timestamp.toLocaleString('id-ID'),
            action: 'Monitor',
            affected: 'System Performance'
          }))
        : [
            {
              message: 'System running smoothly - no critical alerts',
              severity: 'success',
              time: new Date().toLocaleString('id-ID'),
              action: 'Monitor',
              affected: 'All Systems'
            }
          ];

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Optimized alerts error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// @desc    Get location stats (OPTIMIZED)
// @route   GET /api/system/locations
// @access  Super Admin
router.get('/locations', 
  superAdminAuth,
  cacheMiddleware(systemCache, CACHE_KEYS.SYSTEM_LOCATIONS, 120), // 2 minute cache
  async (req, res) => {
    try {
      const [users, products] = await batchDatabaseOperations([
        User.find({}).lean().select('isActive'),
        Product.find({}).lean().select('quantity minStock')
      ]);
      
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.isActive === true).length;
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => p.quantity <= (p.minStock || 10)).length;

      const locations = [
        {
          location: 'User Management',
          products: totalUsers,
          alerts: totalUsers - activeUsers,
          health: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 100
        },
        {
          location: 'Product Management',
          products: totalProducts,
          alerts: lowStockProducts,
          health: totalProducts > 0 ? Math.round(((totalProducts - lowStockProducts) / totalProducts) * 100) : 100
        },
        {
          location: 'System Core',
          products: 1,
          alerts: 0,
          health: 100
        }
      ];

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      console.error('Optimized locations error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;