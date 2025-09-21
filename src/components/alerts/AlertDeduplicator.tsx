import React, { createContext, useContext, useRef, useCallback } from 'react';

interface AlertDeduplicatorContextType {
  shouldProcessAlert: (alertKey: string) => boolean;
  recordAlertProcessed: (alertKey: string) => void;
}

const AlertDeduplicatorContext = createContext<AlertDeduplicatorContextType | undefined>(undefined);

export const useAlertDeduplicator = () => {
  const context = useContext(AlertDeduplicatorContext);
  if (!context) {
    throw new Error('useAlertDeduplicator must be used within AlertDeduplicatorProvider');
  }
  return context;
};

// Global alert deduplicator to prevent duplicate alerts across the app
export const AlertDeduplicatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const processedAlertsRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const shouldProcessAlert = useCallback((alertKey: string): boolean => {
    return !processedAlertsRef.current.has(alertKey);
  }, []);

  const recordAlertProcessed = useCallback((alertKey: string) => {
    processedAlertsRef.current.add(alertKey);
    
    // Clear existing timeout for this alert
    const existingTimeout = timeoutRef.current.get(alertKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Remove from processed set after 10 minutes
    const timeout = setTimeout(() => {
      processedAlertsRef.current.delete(alertKey);
      timeoutRef.current.delete(alertKey);
    }, 600000); // 10 minutes
    
    timeoutRef.current.set(alertKey, timeout);
  }, []);

  return (
    <AlertDeduplicatorContext.Provider value={{ shouldProcessAlert, recordAlertProcessed }}>
      {children}
    </AlertDeduplicatorContext.Provider>
  );
};