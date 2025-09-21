// Centralized connection management utility
import { createComponentLogger } from '@/utils/logger';

interface ConnectionState {
  isOnline: boolean;
  lastCheck: Date | null;
  error: string | null;
  consecutiveFailures: number;
}

class ConnectionManager {
  private logger = createComponentLogger('ConnectionManager');
  private state: ConnectionState = {
    isOnline: false,
    lastCheck: null,
    error: null,
    consecutiveFailures: 0,
  };
  
  private listeners: ((state: ConnectionState) => void)[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Listen to browser online/offline events
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));
    
    // Set initial state based on navigator
    this.state.isOnline = navigator.onLine;
  }

  private updateOnlineStatus(isOnline: boolean, error: string | null = null) {
    const previousState = { ...this.state };
    
    this.state = {
      ...this.state,
      isOnline,
      error,
      lastCheck: new Date(),
      consecutiveFailures: isOnline ? 0 : this.state.consecutiveFailures + 1,
    };

    // Only notify if state actually changed
    if (previousState.isOnline !== isOnline || previousState.error !== error) {
      this.logger.debug('Connection state changed', {
        from: { isOnline: previousState.isOnline, error: previousState.error },
        to: { isOnline, error },
      });
      
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    // Debounce notifications to prevent spam
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.listeners.forEach(listener => {
        try {
          listener({ ...this.state });
        } catch (error) {
          this.logger.error('Error in connection listener', error);
        }
      });
    }, 100);
  }

  subscribe(listener: (state: ConnectionState) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current state
    listener({ ...this.state });
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  // Manual connection test (should be used sparingly)
  async testConnection(healthCheckFn: () => Promise<boolean>): Promise<boolean> {
    try {
      this.logger.debug('Testing connection manually');
      const isHealthy = await healthCheckFn();
      
      this.updateOnlineStatus(isHealthy, isHealthy ? null : 'Health check failed');
      return isHealthy;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      this.updateOnlineStatus(false, errorMessage);
      return false;
    }
  }

  // Force connection status (for auth events)
  setOnline(isOnline: boolean, reason?: string) {
    this.updateOnlineStatus(isOnline, isOnline ? null : reason || 'Manual status change');
  }

  reset() {
    this.state = {
      isOnline: navigator.onLine,
      lastCheck: null,
      error: null,
      consecutiveFailures: 0,
    };
    this.notifyListeners();
  }
}

// Global connection manager instance
export const connectionManager = new ConnectionManager();

// Hook for React components
export const useConnectionManager = () => {
  const [state, setState] = useState(connectionManager.getState());

  useEffect(() => {
    return connectionManager.subscribe(setState);
  }, []);

  return {
    ...state,
    testConnection: (healthCheckFn: () => Promise<boolean>) => 
      connectionManager.testConnection(healthCheckFn),
    setOnline: (isOnline: boolean, reason?: string) => 
      connectionManager.setOnline(isOnline, reason),
  };
};

import { useState, useEffect } from 'react';