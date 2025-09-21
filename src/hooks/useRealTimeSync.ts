// Simplified real-time sync with better error handling
import { useApp } from '@/contexts/AppContext';

export const useRealTimeSync = (options: any = {}) => {
  const { connectionStatus, connectionMetrics, testConnection, config } = useApp();

  // Determine sync status more intelligently
  const getSyncStatus = () => {
    if (!config.apiEnabled) return 'success'; // Local mode is always "success"
    if (connectionStatus.isOnline) return 'success';
    if (connectionMetrics.consecutiveFailures > 5) return 'error';
    return 'success'; // Don't show errors for minor connectivity issues
  };

  const manualSync = async () => {
    if (!config.apiEnabled) return true; // Local mode
    return await testConnection();
  };

  return {
    syncStatus: getSyncStatus(),
    lastSyncTime: connectionStatus.lastCheck,
    errorCount: Math.max(0, connectionMetrics.consecutiveFailures - 3), // Only show after 3+ failures
    manualSync,
    isRealTimeEnabled: config.apiEnabled && connectionStatus.isOnline,
    lastKnownGoodData: connectionMetrics.lastSuccessfulRequest,
    consecutiveErrors: connectionMetrics.consecutiveFailures,
  };
};