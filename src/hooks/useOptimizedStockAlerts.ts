import { useState, useEffect, useCallback, useMemo } from 'react';
import { StockAlert } from '@/types/stock-movement';
import { stockMovementApi } from '@/services/stockMovementApi';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useOptimizedAutoAlerts } from '@/hooks/useOptimizedAutoAlerts';

export const useOptimizedStockAlerts = () => {
  const [apiAlerts, setApiAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { config } = useApp();
  const isConfigured = config.apiEnabled;
  
  // Use optimized auto alerts system
  const {
    alerts: autoAlerts,
    acknowledgeAlert: acknowledgeAutoAlert,
    getAlertStats: getAutoAlertStats,
  } = useOptimizedAutoAlerts();

  // Fetch API alerts with error handling
  const fetchAlerts = useCallback(async () => {
    if (!isConfigured) {
      setApiAlerts([]);
      return;
    }

    setLoading(true);
    try {
      const data = await stockMovementApi.getStockAlerts();
      setApiAlerts(data || []);
    } catch (error) {
      console.error('Failed to fetch stock alerts:', error);
      // Don't show toast for every failed request to avoid spam
      setApiAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  // Fetch alerts on mount only
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Acknowledge API alert
  const acknowledgeApiAlert = useCallback(async (alertId: string, acknowledgedBy: string) => {
    if (!isConfigured) return;

    setLoading(true);
    try {
      await stockMovementApi.acknowledgeStockAlert(alertId);
      
      setApiAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedBy, acknowledgedAt: new Date() }
          : alert
      ));

      toast({
        title: "Alert Acknowledged",
        description: "Stock alert has been acknowledged successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isConfigured, toast]);

  // Convert auto alerts to stock alerts format (memoized)
  const convertedAutoAlerts: StockAlert[] = useMemo(() => 
    autoAlerts.map(alert => ({
      id: alert.id,
      productId: alert.productId,
      productName: alert.productName,
      productCode: alert.productCode,
      type: alert.type as any,
      severity: alert.severity,
      message: alert.message,
      currentValue: alert.currentStock,
      threshold: alert.threshold,
      timestamp: alert.timestamp,
      acknowledged: alert.acknowledged,
      acknowledgedBy: alert.acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt,
      currentStock: alert.currentStock,
    })), [autoAlerts]
  );

  // Combine all alerts (memoized)
  const allAlerts = useMemo(() => 
    [...apiAlerts, ...convertedAutoAlerts], 
    [apiAlerts, convertedAutoAlerts]
  );

  // Memoized filter functions
  const getUnacknowledgedAlerts = useMemo(() => 
    allAlerts.filter(alert => !alert.acknowledged), 
    [allAlerts]
  );

  const getAlertsBySeverity = useCallback((severity: string) => 
    allAlerts.filter(alert => alert.severity === severity), 
    [allAlerts]
  );

  const getCriticalAlerts = useMemo(() => 
    allAlerts.filter(alert => alert.severity === 'CRITICAL' && !alert.acknowledged), 
    [allAlerts]
  );

  // Unified acknowledge function
  const acknowledgeAlert = useCallback(async (alertId: string, acknowledgedBy: string) => {
    // Check if it's an auto alert first
    const isAutoAlert = autoAlerts.some(alert => alert.id === alertId);
    
    if (isAutoAlert) {
      acknowledgeAutoAlert(alertId, acknowledgedBy);
    } else {
      await acknowledgeApiAlert(alertId, acknowledgedBy);
    }
  }, [autoAlerts, acknowledgeAutoAlert, acknowledgeApiAlert]);

  // Combined stats (memoized)
  const getAlertStats = useMemo(() => {
    const unacknowledged = getUnacknowledgedAlerts;
    return {
      total: allAlerts.length,
      unacknowledged: unacknowledged.length,
      critical: getCriticalAlerts.length,
      high: getAlertsBySeverity('HIGH').filter(a => !a.acknowledged).length,
      medium: getAlertsBySeverity('MEDIUM').filter(a => !a.acknowledged).length,
      low: getAlertsBySeverity('LOW').filter(a => !a.acknowledged).length,
    };
  }, [allAlerts, getUnacknowledgedAlerts, getCriticalAlerts, getAlertsBySeverity]);

  return {
    alerts: allAlerts,
    autoAlerts,
    loading,
    acknowledgeAlert,
    acknowledgeAutoAlert,
    getUnacknowledgedAlerts: () => getUnacknowledgedAlerts,
    getAlertsBySeverity,
    getCriticalAlerts: () => getCriticalAlerts,
    getAlertStats,
    refresh: fetchAlerts,
  };
};