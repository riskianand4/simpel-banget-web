import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuthManager } from "@/hooks/useAuthManager";
import { InventoryApiService } from "@/services/inventoryApi";
import { toast } from "sonner";
import { createComponentLogger } from "@/utils/logger";
import { systemMonitor } from "@/utils/systemMonitor";
import type { User } from "@/types/auth";

interface AppConfig {
  apiEnabled: boolean;
  baseURL: string;
  version: string;
}

interface ConnectionStatus {
  isOnline: boolean;
  lastCheck: Date | null;
  error: string | null;
}

interface ConnectionMetrics {
  latency: number | null;
  lastSuccessfulRequest: Date | null;
  consecutiveFailures: number;
  isHealthy: boolean;
}

interface AppContextType {
  // Auth state from useAuthManager
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;

  // App configuration
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;

  // Connection status
  connectionStatus: ConnectionStatus;
  connectionMetrics: ConnectionMetrics;
  testConnection: () => Promise<boolean>;

  // Legacy compatibility properties
  apiService: InventoryApiService;
  isConfigured: boolean;
  isOnline: boolean;
  clearConfig: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const authManager = useAuthManager();
  const logger = createComponentLogger('AppContext');

  const [apiService] = useState(() => new InventoryApiService());

  const [config, setConfigState] = useState<AppConfig>(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem("app-config");
    if (saved) {
      try {
        return { ...{
          apiEnabled: true,
          baseURL: "http://103.169.41.9:3001",
          version: "1.0.0",
        }, ...JSON.parse(saved) };
      } catch (error) {
        // Failed to load config from localStorage
      }
    }
    return {
      apiEnabled: true,
      baseURL: "http://103.169.41.9:3001",
      version: "1.0.0",
    };
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: false,
    lastCheck: null,
    error: null,
  });

  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    latency: null,
    lastSuccessfulRequest: null,
    consecutiveFailures: 0,
    isHealthy: false,
  });

  // Sync auth token with API service whenever auth state changes
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    
    // Only sync if there's a meaningful change
    if (authManager.isAuthenticated && token) {
      logger.debug('Syncing token to API service', { 
        tokenPreview: token.substring(0, 20) + '...'
      });
      apiService.setToken(token);
    } else if (!authManager.isAuthenticated) {
      logger.debug('Clearing token from API service');
      apiService.setToken(null);
    }
  }, [authManager.isAuthenticated, apiService, logger]);

  // Handle 401 errors by logging out user
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'auth-token' && !e.newValue && authManager.isAuthenticated) {
        logger.info('Auth token removed externally, logging out');
        authManager.logout();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [authManager.isAuthenticated, authManager.logout, logger]);

  // Additional token sync on storage changes (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('auth-token');
      apiService.setToken(token);
      logger.debug('Token synced from storage change', { hasToken: !!token });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [apiService, logger]);

  const setConfig = (newConfig: Partial<AppConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfigState(updatedConfig);
    localStorage.setItem("app-config", JSON.stringify(updatedConfig));
    
    // Sync baseURL with apiClient - use the global apiClient directly
    if (newConfig.baseURL) {
      const { apiClient } = require('@/services/apiClient');
      if (apiClient && apiClient.setBaseURL) {
        apiClient.setBaseURL(newConfig.baseURL);
      }
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!config.apiEnabled) return false;

    const startTime = performance.now();
    try {
      const response = await apiService.healthCheck();
      const endTime = performance.now();
      const latency = endTime - startTime;
      const isOnline = response.success;
      const now = new Date();

      setConnectionStatus({
        isOnline,
        lastCheck: now,
        error: isOnline ? null : "Health check failed",
      });

      setConnectionMetrics(prev => {
        const isHealthy = isOnline && latency < 5000;
        const consecutiveFailures = isHealthy ? 0 : prev.consecutiveFailures + 1;

        return {
          latency,
          lastSuccessfulRequest: isHealthy ? now : prev.lastSuccessfulRequest,
          consecutiveFailures,
          isHealthy,
        };
      });

      return isOnline;
    } catch (error) {
      setConnectionStatus({
        isOnline: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : "Connection failed",
      });

      setConnectionMetrics(prev => ({
        ...prev,
        latency: null,
        consecutiveFailures: prev.consecutiveFailures + 1,
        isHealthy: false,
      }));

      return false;
    }
  };

  const clearConfig = () => {
    setConfigState({
      apiEnabled: false,
      baseURL: "http://103.169.41.9:3001",
      version: "1.0.0",
    });
    localStorage.removeItem("app-config");
  };

  // Minimal connection monitoring - only on user demand and auth events
  useEffect(() => {
    if (!config.apiEnabled || !authManager.isAuthenticated || authManager.isLoading) {
      // Set offline when not configured or authenticated
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: false,
        error: config.apiEnabled ? 'Authentication required' : 'API disabled'
      }));
      return;
    }

    // Set online when authenticated (assume connection works after successful auth)
    setConnectionStatus(prev => ({
      ...prev,
      isOnline: true,
      error: null,
      lastCheck: new Date()
    }));

    // Very minimal monitoring - only when user is active (no automatic checks)
    const handleVisibilityChange = () => {
      if (!document.hidden && authManager.isAuthenticated && !authManager.isLoading) {
        // Only test connection if we haven't checked in the last 30 minutes
        const now = Date.now();
        const lastCheck = connectionStatus.lastCheck?.getTime() || 0;
        if (now - lastCheck > 1800000) { // 30 minutes
          testConnection();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [config.apiEnabled, authManager.isAuthenticated, authManager.isLoading]);

  const value: AppContextType = {
    // Auth methods from useAuthManager
    ...authManager,

    // App configuration
    config,
    setConfig,

    // Connection status
    connectionStatus,
    connectionMetrics,
    testConnection,

    // Legacy compatibility properties
    apiService,
    isConfigured: config.apiEnabled,
    isOnline: connectionStatus.isOnline,
    clearConfig,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
