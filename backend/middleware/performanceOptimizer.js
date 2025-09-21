const os = require('os');
const { invalidateCache } = require('../utils/performanceCache');

class BackendPerformanceOptimizer {
  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      slowRequestCount: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      peakMemoryUsage: 0,
      lastOptimization: Date.now()
    };
    
    this.thresholds = {
      slowRequestTime: 1000, // 1 second
      highMemoryThreshold: 100 * 1024 * 1024, // 100MB
      highErrorRate: 0.05, // 5%
      optimizationInterval: 5 * 60 * 1000 // 5 minutes
    };

    this.startPerformanceMonitoring();
  }

  // Middleware for request optimization
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Track request
      this.metrics.requestCount++;

      // Override res.end to capture response time
      const originalEnd = res.end.bind(res);
      res.end = (...args) => {
        const responseTime = Date.now() - startTime;
        this.trackRequest(req, res, responseTime);
        originalEnd(...args);
      };

      next();
    };
  }

  trackRequest(req, res, responseTime) {
    // Update metrics
    this.metrics.totalResponseTime += responseTime;
    this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;

    // Track slow requests
    if (responseTime > this.thresholds.slowRequestTime) {
      this.metrics.slowRequestCount++;
      console.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // Track errors
    if (res.statusCode >= 400) {
      this.metrics.errorCount++;
    }

    // Track memory usage
    const memoryUsage = process.memoryUsage().heapUsed;
    if (memoryUsage > this.metrics.peakMemoryUsage) {
      this.metrics.peakMemoryUsage = memoryUsage;
    }

    // Trigger optimization if needed
    this.checkOptimizationTriggers();
  }

  checkOptimizationTriggers() {
    const now = Date.now();
    const timeSinceLastOptimization = now - this.metrics.lastOptimization;

    // Check if optimization is needed
    if (timeSinceLastOptimization > this.thresholds.optimizationInterval) {
      this.performOptimizations();
      this.metrics.lastOptimization = now;
    }

    // Emergency optimizations
    const errorRate = this.metrics.errorCount / this.metrics.requestCount;
    const slowRequestRate = this.metrics.slowRequestCount / this.metrics.requestCount;

    if (errorRate > this.thresholds.highErrorRate) {
      console.warn('High error rate detected, performing emergency cache clear');
      invalidateCache.all();
    }

    if (this.metrics.peakMemoryUsage > this.thresholds.highMemoryThreshold) {
      console.warn('High memory usage detected, performing garbage collection');
      if (global.gc) {
        global.gc();
      }
    }
  }

  performOptimizations() {
    console.log('Performing scheduled performance optimizations...');
    
    // Clear old cache entries if memory usage is high
    if (this.metrics.peakMemoryUsage > this.thresholds.highMemoryThreshold / 2) {
      invalidateCache.system();
    }

    // Force garbage collection if available
    if (global.gc && this.metrics.peakMemoryUsage > this.thresholds.highMemoryThreshold) {
      global.gc();
      console.log('Forced garbage collection completed');
    }

    // Reset peak memory tracking
    this.metrics.peakMemoryUsage = process.memoryUsage().heapUsed;

    console.log('Performance optimization completed', {
      avgResponseTime: `${this.metrics.avgResponseTime.toFixed(2)}ms`,
      slowRequestRate: `${((this.metrics.slowRequestCount / this.metrics.requestCount) * 100).toFixed(2)}%`,
      errorRate: `${((this.metrics.errorCount / this.metrics.requestCount) * 100).toFixed(2)}%`,
      memoryUsage: `${(this.metrics.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`
    });
  }

  startPerformanceMonitoring() {
    // Monitor system resources every 30 seconds
    setInterval(() => {
      this.monitorSystemResources();
    }, 30000);

    // Reset metrics every hour to prevent overflow
    setInterval(() => {
      this.resetMetrics();
    }, 60 * 60 * 1000);
  }

  monitorSystemResources() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    // Log warnings for high resource usage
    if (memUsage.heapUsed > this.thresholds.highMemoryThreshold) {
      console.warn('High memory usage detected:', {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        loadAverage: loadAvg[0].toFixed(2)
      });
    }

    // Clear caches if memory usage is very high
    if (memUsage.heapUsed > this.thresholds.highMemoryThreshold * 1.5) {
      console.warn('Critical memory usage, clearing all caches');
      invalidateCache.all();
    }
  }

  resetMetrics() {
    console.log('Resetting performance metrics', {
      totalRequests: this.metrics.requestCount,
      avgResponseTime: `${this.metrics.avgResponseTime.toFixed(2)}ms`,
      slowRequestRate: `${((this.metrics.slowRequestCount / this.metrics.requestCount) * 100).toFixed(2)}%`
    });

    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      slowRequestCount: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      peakMemoryUsage: process.memoryUsage().heapUsed,
      lastOptimization: Date.now()
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.requestCount > 0 ? this.metrics.errorCount / this.metrics.requestCount : 0,
      slowRequestRate: this.metrics.requestCount > 0 ? this.metrics.slowRequestCount / this.metrics.requestCount : 0,
      currentMemoryUsage: process.memoryUsage().heapUsed,
      uptime: process.uptime()
    };
  }
}

const performanceOptimizer = new BackendPerformanceOptimizer();

module.exports = {
  performanceOptimizer,
  performanceMiddleware: performanceOptimizer.middleware()
};