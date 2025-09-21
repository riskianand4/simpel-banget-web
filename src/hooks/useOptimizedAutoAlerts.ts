import { useState, useEffect, useCallback, useMemo } from 'react';
import { AutoAlert, AlertSettings, AlertThreshold } from '@/types/alert-settings';
import { Product } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Optimized default thresholds
const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    id: 'critical-out-of-stock',
    type: 'out_of_stock',
    name: 'Stock Habis',
    description: 'Product sudah habis',
    enabled: true,
    threshold: 0,
    severity: 'CRITICAL',
    conditions: { checkPercentage: false, checkAbsolute: true, absoluteValue: 0 }
  },
  {
    id: 'critical-low-stock',
    type: 'low_stock',
    name: 'Stock Kritikal',
    description: 'Stock tersisa kurang dari 10%',
    enabled: true,
    threshold: 10,
    severity: 'CRITICAL',
    conditions: { checkPercentage: true, checkAbsolute: false }
  },
  {
    id: 'high-low-stock',
    type: 'low_stock',
    name: 'Stock Rendah',
    description: 'Stock tersisa kurang dari 20%',
    enabled: true,
    threshold: 20,
    severity: 'HIGH',
    conditions: { checkPercentage: true, checkAbsolute: false }
  }
];

export const useOptimizedAutoAlerts = () => {
  const [alerts, setAlerts] = useState<AutoAlert[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastProcessedTime, setLastProcessedTime] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Memoized settings initialization
  const initSettings = useMemo(() => {
    if (!user) return null;
    
    const saved = localStorage.getItem('alertSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem('alertSettings');
      }
    }
    
    return {
      id: `settings-${Date.now()}`,
      userId: user.id,
      role: user.role || 'user',
      thresholds: DEFAULT_THRESHOLDS,
      notifications: { email: false, inApp: true, sound: true },
      autoAcknowledge: { enabled: false, afterHours: 24 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }, [user]);

  // Initialize settings only once
  useEffect(() => {
    if (initSettings && !alertSettings) {
      setAlertSettings(initSettings);
      if (!localStorage.getItem('alertSettings')) {
        localStorage.setItem('alertSettings', JSON.stringify(initSettings));
      }
    }
  }, [initSettings, alertSettings]);

  // Load existing alerts only once
  useEffect(() => {
    const saved = localStorage.getItem('autoAlerts');
    if (saved && alerts.length === 0) {
      try {
        const parsedAlerts = JSON.parse(saved).map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
          acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : undefined,
        }));
        setAlerts(parsedAlerts);
      } catch {
        localStorage.removeItem('autoAlerts');
      }
    }
  }, [alerts.length]);

  // Optimized alert generation with debouncing
  const generateAlerts = useCallback(async (products: Product[]) => {
    if (!alertSettings || isGenerating || !products?.length) return;

    // Debounce: don't process more than once per 30 seconds
    const now = Date.now();
    if (now - lastProcessedTime < 30000) return;

    setIsGenerating(true);
    setLastProcessedTime(now);

    try {
      const newAlerts: AutoAlert[] = [];
      const processedProductIds = new Set<string>();

      // Get existing unacknowledged alerts to avoid duplicates
      const existingAlerts = new Set(
        alerts.filter(alert => !alert.acknowledged).map(alert => alert.productId)
      );

      for (const product of products) {
        if (processedProductIds.has(product.id) || existingAlerts.has(product.id)) {
          continue;
        }

        processedProductIds.add(product.id);

        // Safe stock calculation
        const stockValue = product.stock;
        let currentStock = 0;
        let maxStock = 0;

        if (typeof stockValue === 'number') {
          currentStock = stockValue;
          maxStock = Math.max(product.minStock || 100, currentStock * 2);
        } else if (stockValue && typeof stockValue === 'object') {
          currentStock = (stockValue as any).current || 0;
          maxStock = (stockValue as any).maximum || Math.max(100, currentStock * 2);
        }

        const percentage = maxStock > 0 ? (currentStock / maxStock) * 100 : 0;

        // Find highest priority triggered threshold
        let highestPriorityAlert: { threshold: AlertThreshold; message: string; priority: number } | null = null;
        const severityPriority = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };

        for (const threshold of alertSettings.thresholds) {
          if (!threshold.enabled) continue;

          let shouldAlert = false;
          let alertMessage = '';

          if (threshold.type === 'out_of_stock' && currentStock === 0) {
            shouldAlert = true;
            alertMessage = `${product.name} sudah habis!`;
          } else if (threshold.type === 'low_stock' && percentage <= threshold.threshold) {
            shouldAlert = true;
            alertMessage = `${product.name} stock rendah! Tersisa ${currentStock} (${percentage.toFixed(1)}%)`;
          }

          if (shouldAlert) {
            const priority = severityPriority[threshold.severity];
            if (!highestPriorityAlert || priority > highestPriorityAlert.priority) {
              highestPriorityAlert = { threshold, message: alertMessage, priority };
            }
          }
        }

        // Create alert for highest priority issue only
        if (highestPriorityAlert) {
          const newAlert: AutoAlert = {
            id: `alert-${now}-${product.id}`,
            productId: product.id,
            productName: product.name,
            productCode: product.sku || product.id,
            type: highestPriorityAlert.threshold.type,
            severity: highestPriorityAlert.threshold.severity,
            message: highestPriorityAlert.message,
            currentStock,
            totalStock: maxStock,
            percentage: Math.round(percentage * 10) / 10,
            threshold: highestPriorityAlert.threshold.threshold,
            thresholdId: highestPriorityAlert.threshold.id,
            acknowledged: false,
            timestamp: new Date(),
            autoGenerated: true,
          };

          newAlerts.push(newAlert);

          // Show critical alerts immediately
          if (highestPriorityAlert.threshold.severity === 'CRITICAL' && alertSettings.notifications.inApp) {
            toast({
              title: "Alert Kritikal!",
              description: highestPriorityAlert.message,
              variant: "destructive",
            });
          }
        }
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => {
          const updated = [...prev, ...newAlerts];
          // Limit to last 100 alerts to prevent memory issues
          const limited = updated.slice(-100);
          localStorage.setItem('autoAlerts', JSON.stringify(limited));
          return limited;
        });
      }

    } catch (error) {
      console.error('Error generating alerts:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [alertSettings, isGenerating, lastProcessedTime, alerts, toast]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string, acknowledgedBy: string) => {
    setAlerts(prev => {
      const updated = prev.map(alert =>
        alert.id === alertId
          ? { ...alert, acknowledged: true, acknowledgedBy, acknowledgedAt: new Date() }
          : alert
      );
      localStorage.setItem('autoAlerts', JSON.stringify(updated));
      return updated;
    });

    toast({
      title: "Alert Acknowledged",
      description: "Alert berhasil di-acknowledge",
    });
  }, [toast]);

  // Memoized stats calculation
  const getAlertStats = useMemo(() => {
    const unacknowledged = alerts.filter(alert => !alert.acknowledged);
    return {
      total: alerts.length,
      unacknowledged: unacknowledged.length,
      critical: unacknowledged.filter(a => a.severity === 'CRITICAL').length,
      high: unacknowledged.filter(a => a.severity === 'HIGH').length,
      medium: unacknowledged.filter(a => a.severity === 'MEDIUM').length,
      low: unacknowledged.filter(a => a.severity === 'LOW').length,
    };
  }, [alerts]);

  // Update settings (superadmin only)
  const updateAlertSettings = useCallback((newSettings: Partial<AlertSettings>) => {
    if (user?.role !== 'superadmin') {
      toast({
        title: "Access Denied",
        description: "Hanya superadmin yang bisa mengubah alert settings",
        variant: "destructive",
      });
      return;
    }

    setAlertSettings(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...newSettings, updatedAt: new Date() };
      localStorage.setItem('alertSettings', JSON.stringify(updated));
      return updated;
    });
  }, [user?.role, toast]);

  // Auto-cleanup old alerts every hour
  useEffect(() => {
    const cleanup = () => {
      if (!alertSettings?.autoAcknowledge.enabled) return;

      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - alertSettings.autoAcknowledge.afterHours);

      setAlerts(prev => {
        const filtered = prev.filter(alert => 
          !alert.acknowledged || 
          (alert.acknowledgedAt && alert.acknowledgedAt > cutoffTime)
        );
        
        if (filtered.length !== prev.length) {
          localStorage.setItem('autoAlerts', JSON.stringify(filtered));
        }
        
        return filtered;
      });
    };

    const interval = setInterval(cleanup, 60 * 60 * 1000); // Every hour
    return () => clearInterval(interval);
  }, [alertSettings]);

  return {
    alerts,
    alertSettings,
    isGenerating,
    generateAlerts,
    acknowledgeAlert,
    updateAlertSettings,
    getAlertStats,
  };
};