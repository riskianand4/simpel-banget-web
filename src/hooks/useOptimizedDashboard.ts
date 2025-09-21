import { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboardData } from './useDashboardData';
import { createComponentLogger } from '@/utils/logger';

export type LoadingStage = 'initial' | 'stats' | 'secondary' | 'complete';

interface OptimizedDashboardState {
  loadingStage: LoadingStage;
  hasInitialData: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

export const useOptimizedDashboard = () => {
  const logger = createComponentLogger('OptimizedDashboard');
  const dashboardData = useDashboardData();
  const mountedRef = useRef(true);
  
  const [optimizedState, setOptimizedState] = useState<OptimizedDashboardState>({
    loadingStage: 'initial',
    hasInitialData: false,
    lastUpdate: null,
    error: null,
  });

  // Progressive loading state management
  useEffect(() => {
    if (!mountedRef.current) return;

    // Initial loading state
    if (dashboardData.loading && !optimizedState.hasInitialData) {
      setOptimizedState(prev => ({ ...prev, loadingStage: 'initial' }));
      return;
    }

    // First data received - show stats immediately
    if (dashboardData.stats && !optimizedState.hasInitialData) {
      setOptimizedState(prev => ({ 
        ...prev, 
        loadingStage: 'stats',
        hasInitialData: true,
        lastUpdate: new Date(),
      }));
      
      logger.info('Dashboard stats loaded, showing progressive UI');
      return;
    }

    // All data loaded - transition to complete
    if (!dashboardData.loading && optimizedState.hasInitialData) {
      setOptimizedState(prev => ({ 
        ...prev, 
        loadingStage: 'complete',
        lastUpdate: new Date(),
      }));
      
      logger.info('Dashboard fully loaded');
      return;
    }

    // Handle errors
    if (dashboardData.error) {
      setOptimizedState(prev => ({ 
        ...prev, 
        error: dashboardData.error,
        loadingStage: prev.hasInitialData ? 'complete' : 'initial',
      }));
    }
  }, [dashboardData.loading, dashboardData.stats, dashboardData.error, optimizedState.hasInitialData, logger]);

  // Fallback timeout to ensure loading completes
  useEffect(() => {
    if (optimizedState.hasInitialData && optimizedState.loadingStage !== 'complete') {
      const timeout = setTimeout(() => {
        if (mountedRef.current) {
          setOptimizedState(prev => ({ 
            ...prev, 
            loadingStage: 'complete',
            lastUpdate: new Date(),
          }));
          logger.info('Dashboard forced to complete via timeout');
        }
      }, 3000); // 3 second fallback

      return () => clearTimeout(timeout);
    }
  }, [optimizedState.hasInitialData, optimizedState.loadingStage, logger]);

  // Optimized refresh with cache invalidation
  const refreshDashboard = useCallback(async () => {
    // Clear cache for fresh data
    localStorage.removeItem('dashboard-stats-cache');
    localStorage.removeItem('dashboard-stats-timestamp');
    
    setOptimizedState(prev => ({ 
      ...prev, 
      loadingStage: 'secondary',
      error: null,
    }));
    
    await dashboardData.refreshData();
  }, [dashboardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // Dashboard data
    ...dashboardData,
    
    // Optimized state
    loadingStage: optimizedState.loadingStage,
    hasInitialData: optimizedState.hasInitialData,
    lastUpdate: optimizedState.lastUpdate,
    optimizedError: optimizedState.error,
    
    // Actions
    refreshDashboard,
    
    // Computed properties
    isInitialLoading: optimizedState.loadingStage === 'initial',
    isProgressiveLoading: optimizedState.loadingStage === 'stats' || optimizedState.loadingStage === 'secondary',
    isComplete: optimizedState.loadingStage === 'complete',
    shouldShowProgressiveLoader: ['initial', 'stats'].includes(optimizedState.loadingStage),
  };
};

export default useOptimizedDashboard;