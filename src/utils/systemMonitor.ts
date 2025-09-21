import { logger } from './logger';
import { errorReporter } from './errorReporting';

interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
  timestamp: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  metrics: PerformanceMetrics;
  issues: string[];
  recommendations: string[];
}

class SystemMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 100;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private observers: ((health: SystemHealth) => void)[] = [];

  start(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Collect metrics every 30 seconds

    // Initial collection
    this.collectMetrics();
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  subscribe(callback: (health: SystemHealth) => void): () => void {
    this.observers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: await this.getCPUUsage(),
        networkLatency: await this.getNetworkLatency(),
        errorRate: this.getErrorRate(),
        timestamp: Date.now(),
      };

      this.metrics.unshift(metrics);
      
      // Keep only recent metrics
      if (this.metrics.length > this.maxMetrics) {
        this.metrics = this.metrics.slice(0, this.maxMetrics);
      }

      const health = this.analyzeHealth(metrics);
      this.notifyObservers(health);

    } catch (error) {
      logger.error('Failed to collect system metrics', error);
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance && performance.memory) {
      const memory = performance.memory as any;
      if (memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
        return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      }
    }
    return 0;
  }

  private async getCPUUsage(): Promise<number> {
    // Approximate CPU usage using performance timing
    const start = performance.now();
    
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }
    
    const end = performance.now();
    const executionTime = end - start;
    
    // Normalize to a percentage (very rough approximation)
    return Math.min((executionTime / 10) * 100, 100);
  }

  private async getNetworkLatency(): Promise<number> {
    try {
      const start = performance.now();
      
      // Use a lightweight endpoint or create a ping endpoint
      await fetch('/api/health', { method: 'HEAD' });
      
      const end = performance.now();
      return end - start;
    } catch (error) {
      return -1; // Network unavailable
    }
  }

  private getErrorRate(): number {
    if (typeof window === 'undefined') return 0;

    // Get error count from the last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > fiveMinutesAgo);
    
    if (recentMetrics.length === 0) return 0;
    
    const totalErrors = recentMetrics.reduce((sum, m) => sum + (m.errorRate || 0), 0);
    return totalErrors / recentMetrics.length;
  }

  private analyzeHealth(currentMetrics: PerformanceMetrics): SystemHealth {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: SystemHealth['status'] = 'healthy';

    // Memory analysis
    if (currentMetrics.memoryUsage > 90) {
      issues.push('High memory usage detected');
      recommendations.push('Consider refreshing the page to free up memory');
      status = 'critical';
    } else if (currentMetrics.memoryUsage > 70) {
      issues.push('Elevated memory usage');
      recommendations.push('Monitor memory usage closely');
      if (status === 'healthy') status = 'degraded';
    }

    // CPU analysis
    if (currentMetrics.cpuUsage > 80) {
      issues.push('High CPU usage detected');
      recommendations.push('Close unnecessary browser tabs or applications');
      status = 'critical';
    } else if (currentMetrics.cpuUsage > 60) {
      issues.push('Elevated CPU usage');
      if (status === 'healthy') status = 'degraded';
    }

    // Network analysis
    if (currentMetrics.networkLatency < 0) {
      issues.push('Network connectivity issues');
      recommendations.push('Check your internet connection');
      status = 'critical';
    } else if (currentMetrics.networkLatency > 5000) {
      issues.push('High network latency');
      recommendations.push('Network connection is slow');
      if (status === 'healthy') status = 'degraded';
    }

    // Error rate analysis
    if (currentMetrics.errorRate > 10) {
      issues.push('High error rate detected');
      recommendations.push('Multiple errors occurring, consider refreshing');
      status = 'critical';
    } else if (currentMetrics.errorRate > 5) {
      issues.push('Elevated error rate');
      if (status === 'healthy') status = 'degraded';
    }

    // Trend analysis
    if (this.metrics.length >= 5) {
      const recentMetrics = this.metrics.slice(0, 5);
      const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
      
      if (avgMemory > currentMetrics.memoryUsage + 10) {
        recommendations.push('Memory usage is trending upward');
      }
    }

    return {
      status,
      metrics: currentMetrics,
      issues,
      recommendations,
    };
  }

  private notifyObservers(health: SystemHealth): void {
    this.observers.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        logger.error('System monitor observer error', error);
      }
    });

    // Auto-report critical issues
    if (health.status === 'critical') {
      errorReporter.reportError(
        `System health critical: ${health.issues.join(', ')}`,
        'SystemMonitor',
        {
          metrics: health.metrics,
          issues: health.issues,
          recommendations: health.recommendations,
        }
      );
    }
  }

  getLatestHealth(): SystemHealth | null {
    if (this.metrics.length === 0) return null;
    
    const latestMetrics = this.metrics[0];
    return this.analyzeHealth(latestMetrics);
  }

  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const systemMonitor = new SystemMonitor();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  systemMonitor.start();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    systemMonitor.stop();
  });
}
