const express = require('express');
const mongoose = require('mongoose');
const os = require('os');

const router = express.Router();

// @desc    Health check endpoint
// @route   GET /api/health
// @access  Public
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'healthy',
        memory: 'healthy',
        cpu: 'healthy'
      },
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        systemMemory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        loadAverage: os.loadavg()
      }
    };

    // Check database connection
    try {
      await mongoose.connection.db.admin().ping();
      healthStatus.services.database = 'healthy';
    } catch (dbError) {
      healthStatus.services.database = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Check memory usage
    const memoryUsagePercent = (healthStatus.metrics.memoryUsage.heapUsed / healthStatus.metrics.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      healthStatus.services.memory = 'critical';
      healthStatus.status = 'unhealthy';
    } else if (memoryUsagePercent > 70) {
      healthStatus.services.memory = 'warning';
      if (healthStatus.status === 'healthy') {
        healthStatus.status = 'degraded';
      }
    }

    // Check CPU load
    const loadAvg1min = healthStatus.metrics.loadAverage[0];
    const cpuCount = os.cpus().length;
    const cpuUsagePercent = (loadAvg1min / cpuCount) * 100;
    
    if (cpuUsagePercent > 90) {
      healthStatus.services.cpu = 'critical';
      healthStatus.status = 'unhealthy';
    } else if (cpuUsagePercent > 70) {
      healthStatus.services.cpu = 'warning';
      if (healthStatus.status === 'healthy') {
        healthStatus.status = 'degraded';
      }
    }

    // Set appropriate HTTP status code
    let statusCode = 200;
    if (healthStatus.status === 'degraded') {
      statusCode = 200; // Still OK but with warnings
    } else if (healthStatus.status === 'unhealthy') {
      statusCode = 503; // Service unavailable
    }

    res.status(statusCode).json({
      success: true,
      data: healthStatus
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// @desc    Detailed health check for monitoring systems
// @route   GET /api/health/detailed
// @access  Public
router.get('/detailed', async (req, res) => {
  try {
    const detailed = {
      server: {
        nodejs: process.version,
        platform: process.platform,
        architecture: process.arch,
        uptime: process.uptime(),
        pid: process.pid
      },
      database: {
        status: 'unknown',
        connectionState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      system: {
        hostname: os.hostname(),
        type: os.type(),
        release: os.release(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        loadAverage: os.loadavg(),
        networkInterfaces: Object.keys(os.networkInterfaces())
      },
      process: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        env: process.env.NODE_ENV,
        versions: process.versions
      }
    };

    // Test database connection
    try {
      const dbStats = await mongoose.connection.db.stats();
      detailed.database.status = 'healthy';
      detailed.database.stats = {
        collections: dbStats.collections,
        documents: dbStats.objects,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes
      };
    } catch (dbError) {
      detailed.database.status = 'unhealthy';
      detailed.database.error = dbError.message;
    }

    res.json({
      success: true,
      data: detailed
    });

  } catch (error) {
    console.error('Detailed health check failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Detailed health check failed'
    });
  }
});

module.exports = router;