// Enhanced authentication with longer timeouts and better error handling
import { logger } from './logger';

export const authConfig = {
  tokenVerificationTimeout: 10000, // Increased from 3000ms to 10000ms
  maxRetries: 3,
  backoffMultiplier: 2,
  sessionRefreshInterval: 15 * 60 * 1000, // 15 minutes
};

export const handleAuthError = (error: any, context: string) => {
  if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
    logger.warn(`Authentication error in ${context}`, { error: error.message });
    // Clear invalid token
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    return { shouldRetry: false, shouldRedirect: true };
  }
  
  if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
    logger.warn(`Access denied in ${context}`, { error: error.message });
    return { shouldRetry: false, shouldRedirect: false };
  }
  
  // Network or server errors
  logger.error(`API error in ${context}`, { error: error.message });
  return { shouldRetry: true, shouldRedirect: false };
};