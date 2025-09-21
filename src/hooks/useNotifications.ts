import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissedToasts, setDismissedToasts] = useState<string[]>([]);
  const { toast } = useToast();

  // Load notifications and dismissed toasts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    const savedDismissed = localStorage.getItem('dismissed-toasts');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        })));
      } catch (error) {
        // Failed to load notifications
      }
    }
    
    if (savedDismissed) {
      try {
        setDismissedToasts(JSON.parse(savedDismissed));
      } catch (error) {
        // Failed to load dismissed toasts
      }
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Save dismissed toasts to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dismissed-toasts', JSON.stringify(dismissedToasts));
  }, [dismissedToasts]);

  const addNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    actions?: NotificationAction[],
    showToast: boolean = true,
    alertId?: string // Optional alert ID to track dismissals
  ) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      actions,
    };

    setNotifications(prev => [notification, ...prev]);

    // Only show toast if user hasn't dismissed it for this alert and showToast is true
    const toastKey = alertId || `${title}-${message}`;
    if (showToast && !dismissedToasts.includes(toastKey)) {
      toast({
        title,
        description: message,
        variant: type === 'error' ? 'destructive' : 'default',
      });
    }

    return notification.id;
  }, [toast, dismissedToasts]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string, alertId?: string, title?: string, message?: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // When user removes a notification, mark its toast as dismissed
    if (alertId || (title && message)) {
      const toastKey = alertId || `${title}-${message}`;
      setDismissedToasts(prev => [...prev, toastKey]);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    // Mark all current notifications as dismissed for toasts
    notifications.forEach(notif => {
      const toastKey = `${notif.title}-${notif.message}`;
      setDismissedToasts(prev => [...prev, toastKey]);
    });
    setNotifications([]);
  }, [notifications]);

  // Stock alert notifications
  const notifyStockAlert = useCallback((productName: string, currentStock: number, minStock: number) => {
    const severity = currentStock === 0 ? 'error' : 'warning';
    const title = currentStock === 0 ? 'Out of Stock Alert' : 'Low Stock Alert';
    const message = currentStock === 0 
      ? `${productName} is out of stock!`
      : `${productName} is running low (${currentStock}/${minStock} remaining)`;

    return addNotification(severity, title, message, [
      {
        label: 'View Product',
        action: () => {
          // This would navigate to the product details
          // Navigate to product
        },
      },
      {
        label: 'Reorder',
        action: () => {
          // This would open reorder dialog
          // Reorder product
        },
        variant: 'default',
      },
    ]);
  }, [addNotification]);

  // API error notifications
  const notifyApiError = useCallback((operation: string, error: string) => {
    return addNotification(
      'error',
      'API Error',
      `Failed to ${operation}: ${error}`,
      [
        {
          label: 'Retry',
          action: () => {
            // This would retry the failed operation
            // Retry operation
          },
        },
      ]
    );
  }, [addNotification]);

  // Success notifications
  const notifySuccess = useCallback((title: string, message: string) => {
    return addNotification('success', title, message);
  }, [addNotification]);

  // Info notifications
  const notifyInfo = useCallback((title: string, message: string) => {
    return addNotification('info', title, message);
  }, [addNotification]);

  // Clean up old dismissed toasts periodically (keep only last 50)  
  useEffect(() => {
    if (dismissedToasts.length > 50) {
      const recentToasts = dismissedToasts.slice(-50);
      setDismissedToasts(recentToasts);
      localStorage.setItem('dismissed-toasts', JSON.stringify(recentToasts));
    }
  }, [dismissedToasts]);

  const clearDismissedToasts = useCallback(() => {
    setDismissedToasts([]);
    localStorage.removeItem('dismissed-toasts');
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    // Specific notification helpers
    notifyStockAlert,
    notifyApiError,
    notifySuccess,
    notifyInfo,
    clearDismissedToasts,
  };
};

export default useNotifications;