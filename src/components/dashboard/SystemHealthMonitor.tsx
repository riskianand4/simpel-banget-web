import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  Wifi,
  Clock
} from 'lucide-react';
import { systemMonitor } from '@/utils/systemMonitor';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    errorRate: number;
    timestamp: number;
  };
  issues: string[];
  recommendations: string[];
}

export const SystemHealthMonitor: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to health updates
    const unsubscribe = systemMonitor.subscribe(setHealth);
    
    // Get initial health status
    const currentHealth = systemMonitor.getLatestHealth();
    if (currentHealth) {
      setHealth(currentHealth);
    }

    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force a new metrics collection
    systemMonitor.clearMetrics();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatLatency = (latency: number) => {
    if (latency < 0) return 'Offline';
    return `${Math.round(latency)}ms`;
  };

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Monitoring system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading health data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(health.status)}
            <CardTitle>System Health</CardTitle>
            <Badge 
              variant={health.status === 'healthy' ? 'default' : 'destructive'}
              className={health.status === 'healthy' ? 'bg-green-500' : ''}
            >
              {health.status.toUpperCase()}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Last updated: {formatTimestamp(health.metrics.timestamp)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <HardDrive className="h-4 w-4" />
              Memory Usage
            </div>
            <Progress 
              value={health.metrics.memoryUsage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {Math.round(health.metrics.memoryUsage)}% used
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Cpu className="h-4 w-4" />
              CPU Usage
            </div>
            <Progress 
              value={health.metrics.cpuUsage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {Math.round(health.metrics.cpuUsage)}% load
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wifi className="h-4 w-4" />
              Network Latency
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  health.metrics.networkLatency < 0 
                    ? 'bg-red-500' 
                    : health.metrics.networkLatency > 1000 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ 
                  width: health.metrics.networkLatency < 0 
                    ? '100%' 
                    : `${Math.min((health.metrics.networkLatency / 2000) * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatLatency(health.metrics.networkLatency)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Error Rate
            </div>
            <Progress 
              value={health.metrics.errorRate * 10} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {health.metrics.errorRate} errors/min
            </p>
          </div>
        </div>

        {/* Issues */}
        {health.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Current Issues
            </h4>
            <div className="space-y-1">
              {health.issues.map((issue, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>{issue}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {health.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Recommendations
            </h4>
            <div className="space-y-1">
              {health.recommendations.map((rec, index) => (
                <div key={index} className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Healthy State */}
        {health.status === 'healthy' && health.issues.length === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All systems operating normally</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};