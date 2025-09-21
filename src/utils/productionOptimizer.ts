// Production optimization utilities
import { logger } from './logger';

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  memoryUsage: number;
  errorRate: number;
}

class ProductionOptimizer {
  private metrics: PerformanceMetrics = {
    bundleSize: 0,
    loadTime: 0,
    memoryUsage: 0,
    errorRate: 0
  };

  // Optimize bundle loading
  optimizeBundleLoading(): void {
    if (typeof window === 'undefined') return;

    // Preload critical resources
    this.preloadCriticalResources();
    
    // Enable service worker for caching (if available)
    this.registerServiceWorker();
    
    // Optimize images loading
    this.optimizeImageLoading();
  }

  private preloadCriticalResources(): void {
    const criticalResources = [
      '/api/auth/verify',
      '/api/products',
      '/api/dashboard/stats'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          logger.info('Service worker registered', { scope: registration.scope });
        })
        .catch((error) => {
          logger.error('Service worker registration failed', error);
        });
    }
  }

  private optimizeImageLoading(): void {
    // Add intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Monitor performance metrics
  monitorPerformance(): void {
    if (typeof window === 'undefined') return;

    // Monitor bundle size
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.includes('.js'));
      this.metrics.bundleSize = jsResources.reduce((total, resource) => {
        return total + ((resource as any).transferSize || 0);
      }, 0);
    }

    // Monitor memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    }

    // Monitor load time
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
    }

    // Log metrics periodically
    setInterval(() => {
      this.logMetrics();
    }, 60000); // Every minute
  }

  private logMetrics(): void {
    logger.info('Performance metrics', {
      bundleSize: `${(this.metrics.bundleSize / 1024 / 1024).toFixed(2)}MB`,
      loadTime: `${this.metrics.loadTime}ms`,
      memoryUsage: `${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      errorRate: this.metrics.errorRate
    });

    // Alert if metrics exceed thresholds
    if (this.metrics.bundleSize > 5 * 1024 * 1024) { // 5MB
      logger.warn('Bundle size exceeding threshold', { size: this.metrics.bundleSize });
    }

    if (this.metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      logger.warn('Memory usage high', { usage: this.metrics.memoryUsage });
    }
  }

  // Clean up unnecessary console logs in production
  optimizeLogging(): void {
    if (import.meta.env.PROD) {
      // Keep only warn and error in production
      const noop = () => {};
      console.log = noop;
      console.debug = noop;
      console.info = noop;
    }
  }

  // Database connection optimization
  optimizeDatabaseQueries(): string[] {
    return [
      // Suggested database indexes for better performance
      'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);',
      'CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);',
      'CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
      'CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);'
    ];
  }

  // Error rate tracking
  trackError(): void {
    this.metrics.errorRate += 1;
  }

  // Get current performance score (0-100)
  getPerformanceScore(): number {
    let score = 100;

    // Deduct points for poor metrics
    if (this.metrics.bundleSize > 2 * 1024 * 1024) { // 2MB
      score -= 20;
    }

    if (this.metrics.loadTime > 3000) { // 3 seconds
      score -= 25;
    }

    if (this.metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      score -= 15;
    }

    if (this.metrics.errorRate > 5) {
      score -= 40;
    }

    return Math.max(0, score);
  }

  // Initialize all optimizations
  initialize(): void {
    this.optimizeBundleLoading();
    this.monitorPerformance();
    this.optimizeLogging();

    logger.info('Production optimizer initialized', {
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString()
    });
  }
}

export const productionOptimizer = new ProductionOptimizer();

// Auto-initialize in production
if (import.meta.env.PROD && typeof window !== 'undefined') {
  productionOptimizer.initialize();
}
