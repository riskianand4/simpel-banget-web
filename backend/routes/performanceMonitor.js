const express = require('express');
const { performanceOptimizer } = require('../middleware/performanceOptimizer');
const { systemCache, userCache, staticCache } = require('../utils/performanceCache');
const { superAdminAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get performance metrics
// @route   GET /api/performance/metrics
// @access  Super Admin
router.get('/metrics', superAdminAuth, (req, res) => {
  try {
    const metrics = performanceOptimizer.getMetrics();
    const cacheStats = {
      systemCache: {
        keys: systemCache.keys().length,
        stats: systemCache.getStats()
      },
      userCache: {
        keys: userCache.keys().length,
        stats: userCache.getStats()
      },
      staticCache: {
        keys: staticCache.keys().length,
        stats: staticCache.getStats()
      }
    };

    res.json({
      success: true,
      data: {
        performance: metrics,
        cache: cacheStats,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Clear performance caches
// @route   POST /api/performance/clear-cache
// @access  Super Admin
router.post('/clear-cache', superAdminAuth, (req, res) => {
  try {
    const { type } = req.body;
    
    switch (type) {
      case 'system':
        systemCache.flushAll();
        break;
      case 'user':
        userCache.flushAll();
        break;
      case 'static':
        staticCache.flushAll();
        break;
      case 'all':
      default:
        systemCache.flushAll();
        userCache.flushAll();
        staticCache.flushAll();
        break;
    }

    res.json({
      success: true,
      message: `${type || 'all'} cache cleared successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get performance health status
// @route   GET /api/performance/health
// @access  Super Admin
router.get('/health', superAdminAuth, (req, res) => {
  try {
    const metrics = performanceOptimizer.getMetrics();
    
    let status = 'excellent';
    const issues = [];
    
    // Check response time
    if (metrics.avgResponseTime > 1000) {
      status = 'critical';
      issues.push('Average response time is too high');
    } else if (metrics.avgResponseTime > 500) {
      status = 'warning';
      issues.push('Average response time is elevated');
    }
    
    // Check error rate
    if (metrics.errorRate > 0.05) {
      status = 'critical';
      issues.push('Error rate is too high');
    } else if (metrics.errorRate > 0.01) {
      if (status !== 'critical') status = 'warning';
      issues.push('Error rate is elevated');
    }
    
    // Check memory usage
    const memoryUsageMB = metrics.currentMemoryUsage / 1024 / 1024;
    if (memoryUsageMB > 200) {
      status = 'critical';
      issues.push('Memory usage is very high');
    } else if (memoryUsageMB > 100) {
      if (status !== 'critical') status = 'warning';
      issues.push('Memory usage is elevated');
    }

    res.json({
      success: true,
      data: {
        status,
        issues,
        metrics: {
          avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
          errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`,
          slowRequestRate: `${(metrics.slowRequestRate * 100).toFixed(2)}%`,
          memoryUsage: `${memoryUsageMB.toFixed(2)}MB`,
          uptime: `${(metrics.uptime / 3600).toFixed(2)}h`
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;