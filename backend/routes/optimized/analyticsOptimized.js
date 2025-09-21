const express = require('express');
const { query, validationResult } = require('express-validator');
const Product = require('../../models/Product');
const StockMovement = require('../../models/StockMovement');
const Asset = require('../../models/Asset');
const User = require('../../models/User');
const Order = require('../../models/Order');
const { auth } = require('../../middleware/auth');
const { cacheMiddleware, systemCache, batchDatabaseOperations } = require('../../utils/performanceCache');

const router = express.Router();

// @desc    Get dashboard stats (OPTIMIZED)
// @route   GET /api/analytics/dashboard/stats
// @access  Admin/SuperAdmin
router.get('/dashboard/stats', 
  cacheMiddleware(systemCache, 'analytics_dashboard_stats', 120), // 2 minute cache
  async (req, res) => {
    try {
      // Batch all database operations for maximum efficiency
      const [users, products] = await batchDatabaseOperations([
        User.find({}).lean().select('isActive'),
        Product.find({}).lean().select('quantity minStock')
      ]);
      
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.isActive === true).length;
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => p.quantity <= (p.minStock || 10)).length;
      
      const stats = {
        activeUsers: totalUsers,
        productsManaged: totalProducts,
        pendingApprovals: 0,
        lowStockItems: lowStockProducts,
        usersTrend: `${activeUsers} active`,
        productsTrend: `${totalProducts} total`,
        approvalsTrend: '0 pending',
        stockTrend: `${lowStockProducts} low stock`
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// @desc    Get trends data (OPTIMIZED)
// @route   GET /api/analytics/trends
// @access  Admin/SuperAdmin
router.get('/trends',
  [query('period').optional().isIn(['7d', '30d', '90d'])],
  cacheMiddleware(systemCache, (req) => `analytics_trends_${req.query.period || '30d'}`, 300), // 5 minute cache
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const period = req.query.period || '30d';
      const days = parseInt(period.replace('d', ''));
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Use aggregation for better performance
      const [stockMovements, productsData, usersData] = await batchDatabaseOperations([
        StockMovement.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                type: "$type"
              },
              count: { $sum: 1 },
              quantity: { $sum: "$quantity" }
            }
          },
          { $sort: { "_id.date": 1 } }
        ]),
        Product.aggregate([
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
              avgPrice: { $avg: "$price" }
            }
          }
        ]),
        User.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              newUsers: { $sum: 1 }
            }
          },
          { $sort: { "_id": 1 } }
        ])
      ]);

      // Process data efficiently
      const trends = {
        stockMovements: stockMovements || [],
        products: productsData[0] || { totalProducts: 0, totalValue: 0, avgPrice: 0 },
        users: usersData || [],
        period: period,
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Trends error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// @desc    Get inventory analytics (OPTIMIZED)
// @route   GET /api/analytics/inventory/overview
// @access  Admin/SuperAdmin
router.get('/inventory/overview',
  cacheMiddleware(systemCache, 'analytics_inventory_overview', 180), // 3 minute cache
  async (req, res) => {
    try {
      // Use efficient aggregation pipeline
      const [inventoryStats, categoryStats, stockMovementStats] = await batchDatabaseOperations([
        Product.aggregate([
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
              lowStockCount: {
                $sum: {
                  $cond: [
                    { $lte: ["$quantity", { $ifNull: ["$minStock", 10] }] },
                    1,
                    0
                  ]
                }
              },
              outOfStockCount: {
                $sum: {
                  $cond: [{ $eq: ["$quantity", 0] }, 1, 0]
                }
              },
              avgPrice: { $avg: "$price" },
              avgQuantity: { $avg: "$quantity" }
            }
          }
        ]),
        Product.aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
              avgPrice: { $avg: "$price" }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        StockMovement.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
              totalQuantity: { $sum: "$quantity" }
            }
          }
        ])
      ]);

      const overview = {
        summary: inventoryStats[0] || {
          totalProducts: 0,
          totalValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          avgPrice: 0,
          avgQuantity: 0
        },
        categoryBreakdown: categoryStats || [],
        recentMovements: stockMovementStats || [],
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Inventory overview error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// @desc    Get stock velocity analysis (OPTIMIZED)
// @route   GET /api/analytics/stock-velocity
// @access  Admin/SuperAdmin
router.get('/stock-velocity',
  [query('days').optional().isInt({ min: 7, max: 365 })],
  cacheMiddleware(systemCache, (req) => `analytics_stock_velocity_${req.query.days || 30}`, 600), // 10 minute cache
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Efficient aggregation for stock velocity
      const velocityData = await StockMovement.aggregate([
        { $match: { createdAt: { $gte: startDate }, type: 'out' } },
        {
          $group: {
            _id: "$productId",
            totalMovement: { $sum: "$quantity" },
            movementCount: { $sum: 1 },
            lastMovement: { $max: "$createdAt" }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
            pipeline: [{ $project: { name: 1, category: 1, quantity: 1, price: 1 } }]
          }
        },
        {
          $unwind: "$product"
        },
        {
          $addFields: {
            velocityScore: {
              $divide: ["$totalMovement", days]
            },
            turnoverRate: {
              $cond: [
                { $gt: ["$product.quantity", 0] },
                { $divide: ["$totalMovement", "$product.quantity"] },
                0
              ]
            }
          }
        },
        { $sort: { velocityScore: -1 } },
        { $limit: 50 }
      ]);

      res.json({
        success: true,
        data: {
          velocityAnalysis: velocityData,
          period: `${days} days`,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Stock velocity error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// @desc    Get performance metrics (OPTIMIZED)
// @route   GET /api/analytics/performance
// @access  Admin/SuperAdmin
router.get('/performance',
  cacheMiddleware(systemCache, 'analytics_performance', 60), // 1 minute cache
  async (req, res) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Batch performance queries
      const [userActivity, stockActivity, systemActivity] = await batchDatabaseOperations([
        User.aggregate([
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              activeUsers: {
                $sum: {
                  $cond: [
                    { $gte: ["$lastLogin", thirtyDaysAgo] },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ]),
        StockMovement.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: null,
              totalMovements: { $sum: 1 },
              totalQuantity: { $sum: "$quantity" }
            }
          }
        ]),
        Product.aggregate([
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              activeProducts: {
                $sum: {
                  $cond: [{ $gt: ["$quantity", 0] }, 1, 0]
                }
              }
            }
          }
        ])
      ]);

      const performance = {
        userMetrics: userActivity[0] || { totalUsers: 0, activeUsers: 0 },
        stockMetrics: stockActivity[0] || { totalMovements: 0, totalQuantity: 0 },
        systemMetrics: systemActivity[0] || { totalProducts: 0, activeProducts: 0 },
        period: '30 days',
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Performance analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;