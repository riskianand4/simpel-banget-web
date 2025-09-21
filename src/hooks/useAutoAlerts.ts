import { useState, useEffect, useCallback } from 'react';
import { AutoAlert, AlertSettings, AlertThreshold } from '@/types/alert-settings';
import { Product } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Default alert thresholds for different user roles
const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    id: 'low-stock-critical',
    type: 'low_stock',
    name: 'Stock Kritikal',
    description: 'Stock tersisa kurang dari 10%',
    enabled: true,
    threshold: 10,
    severity: 'CRITICAL',
    conditions: {
      checkPercentage: true,
      checkAbsolute: false,
    }
  },
  {
    id: 'low-stock-high',
    type: 'low_stock',
    name: 'Stock Rendah',
    description: 'Stock tersisa kurang dari 20%',
    enabled: true,
    threshold: 20,
    severity: 'HIGH',
    conditions: {
      checkPercentage: true,
      checkAbsolute: false,
    }
  },
  {
    id: 'low-stock-medium',
    type: 'low_stock',
    name: 'Stock Peringatan',
    description: 'Stock tersisa kurang dari 30%',
    enabled: true,
    threshold: 30,
    severity: 'MEDIUM',
    conditions: {
      checkPercentage: true,
      checkAbsolute: false,
    }
  },
  {
    id: 'out-of-stock',
    type: 'out_of_stock',
    name: 'Stock Habis',
    description: 'Product sudah habis',
    enabled: true,
    threshold: 0,
    severity: 'CRITICAL',
    conditions: {
      checkPercentage: false,
      checkAbsolute: true,
      absoluteValue: 0,
    }
  }
];

export const useAutoAlerts = () => {
  const [alerts, setAlerts] = useState<AutoAlert[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize default settings based on user role
  useEffect(() => {
    const initializeSettings = () => {
      const saved = localStorage.getItem('alertSettings');
      if (saved) {
        setAlertSettings(JSON.parse(saved));
      } else {
        const defaultSettings: AlertSettings = {
          id: `settings-${Date.now()}`,
          userId: user?.id,
          role: user?.role === 'superadmin' ? 'superadmin' : user?.role || 'user',
          thresholds: DEFAULT_THRESHOLDS,
          notifications: {
            email: false,
            inApp: true,
            sound: true,
          },
          autoAcknowledge: {
            enabled: false,
            afterHours: 24,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setAlertSettings(defaultSettings);
        localStorage.setItem('alertSettings', JSON.stringify(defaultSettings));
      }
    };

    initializeSettings();
  }, [user]);

  // Load existing alerts
  useEffect(() => {
    const saved = localStorage.getItem('autoAlerts');
    if (saved) {
      const parsedAlerts = JSON.parse(saved).map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
        acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : undefined,
      }));
      setAlerts(parsedAlerts);
    }
  }, []);

  // Generate alerts based on current products and thresholds
  const generateAlerts = useCallback(async (products: Product[]) => {
    if (!alertSettings || isGenerating) return;

    setIsGenerating(true);
    const newAlerts: AutoAlert[] = [];

    try {
      for (const product of products) {
        // Safely handle stock value with proper null checks
        const stockValue = product.stock;
        let currentStock = 0;
        let maxStock = 0;
        
        if (stockValue === null || stockValue === undefined) {
          currentStock = 0;
          maxStock = product.minStock || 10;
        } else if (typeof stockValue === 'object' && stockValue !== null) {
          currentStock = (stockValue as any).current || 0;
          maxStock = (stockValue as any).maximum || currentStock * 2;
        } else {
          currentStock = stockValue;
          maxStock = product.minStock ? currentStock + product.minStock : currentStock * 2;
        }

        // Calculate percentage
        const percentage = maxStock > 0 ? (currentStock / maxStock) * 100 : 0;

        // Check if product already has unacknowledged alert
        const existingUnacknowledgedAlert = alerts.find(alert => 
          alert.productId === product.id && !alert.acknowledged
        );

        if (existingUnacknowledgedAlert) {
          continue; // Skip if product already has an active alert
        }

        // Define severity priority (higher number = higher priority)
        const severityPriority = {
          'LOW': 1,
          'MEDIUM': 2, 
          'HIGH': 3,
          'CRITICAL': 4
        };

        // Collect all triggered alerts for this product
        const triggeredAlerts: {
          threshold: AlertThreshold;
          message: string;
          priority: number;
        }[] = [];

        // Check each enabled threshold
        for (const threshold of alertSettings.thresholds) {
          if (!threshold.enabled) continue;

          let shouldAlert = false;
          let alertMessage = '';

          switch (threshold.type) {
            case 'out_of_stock':
              if (currentStock === 0) {
                shouldAlert = true;
                alertMessage = `${product.name} sudah habis! Stock: ${currentStock}`;
              }
              break;

            case 'low_stock':
              if (threshold.conditions.checkPercentage && percentage <= threshold.threshold) {
                shouldAlert = true;
                alertMessage = `${product.name} stock rendah! Tersisa ${currentStock} (${percentage.toFixed(1)}%)`;
              }
              if (threshold.conditions.checkAbsolute && threshold.conditions.absoluteValue && 
                  currentStock <= threshold.conditions.absoluteValue) {
                shouldAlert = true;
                alertMessage = `${product.name} stock rendah! Tersisa ${currentStock} unit`;
              }
              break;

            case 'overstocked':
              if (percentage >= threshold.threshold) {
                shouldAlert = true;
                alertMessage = `${product.name} overstocked! Stock: ${currentStock} (${percentage.toFixed(1)}%)`;
              }
              break;
          }

          if (shouldAlert) {
            triggeredAlerts.push({
              threshold,
              message: alertMessage,
              priority: severityPriority[threshold.severity]
            });
          }
        }

        // If multiple alerts triggered, use only the highest priority one
        if (triggeredAlerts.length > 0) {
          const highestPriorityAlert = triggeredAlerts.reduce((prev, current) => 
            current.priority > prev.priority ? current : prev
          );

          const newAlert: AutoAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

          // Show toast for critical alerts
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
        const updatedAlerts = [...alerts, ...newAlerts];
        setAlerts(updatedAlerts);
        localStorage.setItem('autoAlerts', JSON.stringify(updatedAlerts));

        // Alerts generated silently
      }

    } catch (error) {
      // Error generating alerts handled silently
      toast({
        title: "Error",
        description: "Gagal generate alerts otomatis",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [alertSettings, alerts, toast, isGenerating]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string, acknowledgedBy: string) => {
    setAlerts(prev => {
      const updated = prev.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              acknowledged: true,
              acknowledgedBy,
              acknowledgedAt: new Date(),
            }
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

  // Update alert settings (only for superadmin)
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
      const updated = {
        ...prev,
        ...newSettings,
        updatedAt: new Date(),
      };
      localStorage.setItem('alertSettings', JSON.stringify(updated));
      return updated;
    });

    toast({
      title: "Settings Updated",
      description: "Alert settings berhasil diupdate",
    });
  }, [user?.role, toast]);

  // Get alert statistics
  const getAlertStats = useCallback(() => {
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

  // Clear acknowledged alerts older than specified hours
  const clearOldAlerts = useCallback(() => {
    if (!alertSettings?.autoAcknowledge.enabled) return;

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - alertSettings.autoAcknowledge.afterHours);

    setAlerts(prev => {
      const filtered = prev.filter(alert => 
        !alert.acknowledged || 
        (alert.acknowledgedAt && alert.acknowledgedAt > cutoffTime)
      );
      localStorage.setItem('autoAlerts', JSON.stringify(filtered));
      return filtered;
    });
  }, [alertSettings]);

  // Auto-clear old alerts every hour
  useEffect(() => {
    const interval = setInterval(clearOldAlerts, 60 * 60 * 1000); // Every hour
    return () => clearInterval(interval);
  }, [clearOldAlerts]);

  return {
    alerts,
    alertSettings,
    isGenerating,
    generateAlerts,
    acknowledgeAlert,
    updateAlertSettings,
    getAlertStats,
    clearOldAlerts,
  };
};