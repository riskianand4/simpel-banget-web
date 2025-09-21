import { useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';

// Simplified connection monitor that uses AppContext's connection management
export const useOptimizedConnectionMonitor = () => {
  const { connectionStatus, connectionMetrics, testConnection } = useApp();

  // Manual connection test (no automatic polling)
  const checkConnection = useCallback(async () => {
    return await testConnection();
  }, [testConnection]);

  return {
    connectionStatus,
    metrics: connectionMetrics,
    isOnline: connectionStatus.isOnline,
    isHealthy: connectionMetrics.isHealthy,
    latency: connectionMetrics.latency,
    lastCheck: connectionStatus.lastCheck,
    consecutiveFailures: connectionMetrics.consecutiveFailures,
    checkConnection,
    // Remove automatic polling - connection checks only happen:
    // 1. When user manually triggers it
    // 2. Every 15 minutes from AppContext (much less frequent)
    // 3. On authentication events
  };
};