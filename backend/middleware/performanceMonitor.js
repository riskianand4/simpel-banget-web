const os = require('os');

// Performance monitoring middleware
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      errorCount: 0,
      slowRequests: 0,
      memoryUsage: [],
      cpuUsage: [],
    };
    
    this.thresholds = {
      slowRequestMs: 2000,
      highMemoryMB: 512,
      highCpuPercent: 80,
    };

    // Start monitoring
    this.startMonitoring();
  }

  startMonitoring() {
    // Monitor system resources every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
  }

  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    
    // Calculate CPU usage
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Store metrics (keep last 60 entries - 30 minutes)
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      usage: memUsageMB,
    });
    
    this.metrics.cpuUsage.push({
      timestamp: Date.now(),
      usage: cpuUsage,
    });

    // Trim old entries
    if (this.metrics.memoryUsage.length > 60) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-60);
    }
    
    if (this.metrics.cpuUsage.length > 60) {
      this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-60);
    }

    // Log warnings
    if (memUsageMB > this.thresholds.highMemoryMB) {
      console.warn(`High memory usage: ${memUsageMB.toFixed(2)}MB`);
    }

    if (cpuUsage > this.thresholds.highCpuPercent) {
      console.warn(`High CPU usage: ${cpuUsage.toFixed(2)}%`);
    }
  }

  middleware() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      
      // Track request
      this.metrics.requests++;

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = (...args) => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Update metrics
        this.metrics.totalResponseTime += responseTime;
        
        if (responseTime > this.thresholds.slowRequestMs) {
          this.metrics.slowRequests++;
          console.warn(`Slow request detected: ${req.method} ${req.originalUrl} - ${responseTime.toFixed(2)}ms`);
        }

        if (res.statusCode >= 400) {
          this.metrics.errorCount++;
        }

        // Add performance headers
        res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
        
        // Log performance data for critical endpoints
        if (responseTime > 1000 || res.statusCode >= 500) {
          console.log('Performance Log:', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime.toFixed(2)}ms`,
            memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
            timestamp: new Date().toISOString(),
          });
        }

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  getMetrics() {
    const avgResponseTime = this.metrics.requests > 0 
      ? this.metrics.totalResponseTime / this.metrics.requests 
      : 0;

    const currentMemory = process.memoryUsage();
    const currentMemoryMB = currentMemory.heapUsed / 1024 / 1024;

    return {
      requests: this.metrics.requests,
      averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      errorCount: this.metrics.errorCount,
      slowRequests: this.metrics.slowRequests,
      errorRate: this.metrics.requests > 0 
        ? ((this.metrics.errorCount / this.metrics.requests) * 100).toFixed(2) 
        : 0,
      slowRequestRate: this.metrics.requests > 0 
        ? ((this.metrics.slowRequests / this.metrics.requests) * 100).toFixed(2) 
        : 0,
      currentMemory: {
        heapUsed: parseFloat(currentMemoryMB.toFixed(2)),
        heapTotal: parseFloat((currentMemory.heapTotal / 1024 / 1024).toFixed(2)),
        external: parseFloat((currentMemory.external / 1024 / 1024).toFixed(2)),
      },
      memoryHistory: this.metrics.memoryUsage.slice(-10), // Last 10 entries
      cpuHistory: this.metrics.cpuUsage.slice(-10),
      systemInfo: {
        uptime: process.uptime(),
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
      }
    };
  }

  resetMetrics() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      errorCount: 0,
      slowRequests: 0,
      memoryUsage: [],
      cpuUsage: [],
    };
  }

  // Get health status
  getHealthStatus() {
    const metrics = this.getMetrics();
    let status = 'healthy';
    const issues = [];

    // Check memory usage
    if (metrics.currentMemory.heapUsed > this.thresholds.highMemoryMB) {
      status = 'degraded';
      issues.push(`High memory usage: ${metrics.currentMemory.heapUsed}MB`);
    }

    // Check error rate
    if (parseFloat(metrics.errorRate) > 5) {
      status = 'degraded';
      issues.push(`High error rate: ${metrics.errorRate}%`);
    }

    // Check slow request rate
    if (parseFloat(metrics.slowRequestRate) > 10) {
      status = 'degraded';
      issues.push(`High slow request rate: ${metrics.slowRequestRate}%`);
    }

    // Check recent CPU usage
    if (this.metrics.cpuUsage.length > 0) {
      const recentCpu = this.metrics.cpuUsage.slice(-5);
      const avgCpu = recentCpu.reduce((sum, entry) => sum + entry.usage, 0) / recentCpu.length;
      
      if (avgCpu > this.thresholds.highCpuPercent) {
        status = 'critical';
        issues.push(`High CPU usage: ${avgCpu.toFixed(2)}%`);
      }
    }

    return {
      status,
      issues,
      metrics,
      timestamp: new Date().toISOString(),
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

module.exports = {
  performanceMonitor,
  performanceMiddleware: performanceMonitor.middleware(),
};
