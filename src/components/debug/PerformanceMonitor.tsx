import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, RefreshCw, Zap, Clock, Activity } from 'lucide-react';
import { createComponentLogger } from '@/utils/logger';

interface PerformanceMetrics {
  authInitTime: number;
  dashboardLoadTime: number;
  apiResponseTimes: Record<string, number>;
  renderCount: number;
  cacheHits: number;
  cacheMisses: number;
  lastUpdated: string;
}

export const PerformanceMonitor: React.FC = () => {
  const logger = createComponentLogger('PerformanceMonitor');
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    authInitTime: 0,
    dashboardLoadTime: 0,
    apiResponseTimes: {},
    renderCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastUpdated: new Date().toLocaleTimeString(),
  });
  const [isVisible, setIsVisible] = useState(false);

  // Track performance metrics
  useEffect(() => {
    const startTime = performance.now();
    
    // Track render count
    setMetrics(prev => ({ 
      ...prev, 
      renderCount: prev.renderCount + 1,
      lastUpdated: new Date().toLocaleTimeString(),
    }));

    // Check cache status
    const checkCacheStatus = () => {
      const dashboardCache = localStorage.getItem('dashboard-stats-cache');
      const cacheTimestamp = localStorage.getItem('dashboard-stats-timestamp');
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      
      setMetrics(prev => ({
        ...prev,
        cacheHits: dashboardCache && cacheTimestamp ? prev.cacheHits + 1 : prev.cacheHits,
        cacheMisses: !dashboardCache ? prev.cacheMisses + 1 : prev.cacheMisses,
        authInitTime: lastLoginTime ? Date.now() - parseInt(lastLoginTime) : 0,
      }));
    };

    checkCacheStatus();

    // Measure page load time
    const endTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      dashboardLoadTime: endTime - startTime,
    }));

    // Track navigation timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd;
      const loadComplete = timing.loadEventEnd;
      
      if (loadComplete > 0) {
        setMetrics(prev => ({
          ...prev,
          apiResponseTimes: {
            ...prev.apiResponseTimes,
            'page-load': loadComplete - navigationStart,
            'dom-ready': domContentLoaded - navigationStart,
          },
        }));
      }
    }
  }, []);

  // Monitor API calls via performance observer
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('/api/') || entry.name.includes('103.169.41.9:3001')) {
            const url = new URL(entry.name).pathname;
            setMetrics(prev => ({
              ...prev,
              apiResponseTimes: {
                ...prev.apiResponseTimes,
                [url]: entry.duration,
              },
            }));
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource'] });
      
      return () => observer.disconnect();
    }
  }, []);

  const getPerformanceStatus = (time: number, type: 'load' | 'api') => {
    if (type === 'load') {
      if (time < 1000) return { status: 'excellent', color: 'bg-green-500' };
      if (time < 2000) return { status: 'good', color: 'bg-blue-500' };
      if (time < 5000) return { status: 'fair', color: 'bg-yellow-500' };
      return { status: 'poor', color: 'bg-red-500' };
    } else {
      if (time < 500) return { status: 'excellent', color: 'bg-green-500' };
      if (time < 1000) return { status: 'good', color: 'bg-blue-500' };
      if (time < 2000) return { status: 'fair', color: 'bg-yellow-500' };
      return { status: 'poor', color: 'bg-red-500' };
    }
  };

  const resetMetrics = () => {
    setMetrics({
      authInitTime: 0,
      dashboardLoadTime: 0,
      apiResponseTimes: {},
      renderCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastUpdated: new Date().toLocaleTimeString(),
    });
    logger.info('Performance metrics reset');
  };

  // Show only in development or when explicitly enabled
  if (!isVisible && process.env.NODE_ENV === 'production') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    );
  }

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Monitor className="h-4 w-4" />
        <span className="ml-2">Performance</span>
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-background/95 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={resetMetrics}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Load Times */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Dashboard Load
              </span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getPerformanceStatus(metrics.dashboardLoadTime, 'load').color} text-white`}
                >
                  {metrics.dashboardLoadTime.toFixed(0)}ms
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Auth Init
              </span>
              <Badge variant="outline" className="text-xs">
                {metrics.authInitTime > 0 ? `${metrics.authInitTime}ms` : 'N/A'}
              </Badge>
            </div>
          </div>

          {/* Cache Performance */}
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Cache Hits</span>
              <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                {metrics.cacheHits}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Cache Misses</span>
              <Badge variant="secondary" className="bg-red-500 text-white text-xs">
                {metrics.cacheMisses}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Renders</span>
              <Badge variant="outline" className="text-xs">
                {metrics.renderCount}
              </Badge>
            </div>
          </div>

          {/* API Response Times */}
          {Object.keys(metrics.apiResponseTimes).length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <div className="font-medium">API Response Times</div>
              {Object.entries(metrics.apiResponseTimes).slice(0, 3).map(([endpoint, time]) => (
                <div key={endpoint} className="flex justify-between">
                  <span className="truncate max-w-[120px]" title={endpoint}>
                    {endpoint.split('/').pop() || endpoint}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getPerformanceStatus(time, 'api').color} text-white`}
                  >
                    {time.toFixed(0)}ms
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-2">
            Last updated: {metrics.lastUpdated}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;