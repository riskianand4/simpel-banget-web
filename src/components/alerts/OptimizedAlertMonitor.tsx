import React, { useEffect, useRef, useCallback } from 'react';
import { useOptimizedAlerts } from '@/hooks/useOptimizedAlerts';
import { useEnhancedProductManager } from '@/hooks/useEnhancedProductManager';
import { useApp } from '@/contexts/AppContext';
import { createComponentLogger } from '@/utils/logger';

// Single, optimized alert monitor - replaces all other alert systems
const OptimizedAlertMonitor: React.FC = () => {
  const logger = createComponentLogger('OptimizedAlertMonitor');
  const { isAuthenticated } = useApp();
  const { generateAlerts } = useOptimizedAlerts();
  const { products } = useEnhancedProductManager();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const mountedRef = useRef(true);

  // Optimized alert generation with very long intervals
  const runAlertGeneration = useCallback(async () => {
    if (!mountedRef.current || !isAuthenticated) return;

    try {
      const now = Date.now();
      // Minimum 10 minutes between generations (much longer than before)
      if (now - lastCheckRef.current < 600000) return;
      
      lastCheckRef.current = now;

      if (products && products.length > 0) {
        await generateAlerts(products);
        logger.info(`Alert check completed for ${products.length} products`);
      }
    } catch (error) {
      logger.error('Alert generation failed:', error);
      
      // Stop monitoring on persistent errors
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  }, [isAuthenticated, generateAlerts, products, logger]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear any existing interval when not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check after 30 seconds to allow data to load
    const initialTimeout = setTimeout(() => {
      if (mountedRef.current) {
        runAlertGeneration();
      }
    }, 30000);

    // Set up periodic monitoring every 15 minutes (much less frequent)
    intervalRef.current = setInterval(() => {
      if (mountedRef.current && !document.hidden) {
        runAlertGeneration();
      }
    }, 900000); // 15 minutes

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, runAlertGeneration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return null; // This is a background service component
};

export default OptimizedAlertMonitor;