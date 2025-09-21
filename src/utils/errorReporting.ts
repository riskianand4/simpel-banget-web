// Production error reporting utility
import { logger } from './logger';

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  additionalData?: Record<string, unknown>;
}

class ErrorReporter {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  async reportError(
    error: Error | string,
    component?: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    const errorReport: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      component,
      additionalData,
    };

    // Log locally first
    logger.error('Error reported', errorReport);

    // In production, send to error reporting service
    if (!import.meta.env.DEV) {
      try {
        await this.sendToErrorService(errorReport);
      } catch (reportingError) {
        // Fallback if error reporting fails
        logger.error('Failed to report error to service', reportingError);
      }
    }
  }

  private async sendToErrorService(errorReport: ErrorReport): Promise<void> {
    // This would normally send to your error reporting service
    // Examples: Sentry, LogRocket, Bugsnag, DataDog, etc.
    
    const { ENV } = await import('@/config/environment');
    const endpoint = `${ENV.API_BASE_URL}/api/errors`;
    
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      // Use sendBeacon for reliability during page unload
      navigator.sendBeacon(
        endpoint,
        JSON.stringify(errorReport)
      );
    } else {
      // Fallback to fetch
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Silent fail for error reporting
      });
    }
  }

  // Report unhandled errors
  setupGlobalErrorHandling(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'UnhandledPromiseRejection'
      );
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.reportError(
        event.error || new Error(event.message),
        'UncaughtError',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });
  }
}

export const errorReporter = new ErrorReporter();

// Initialize global error handling
if (typeof window !== 'undefined') {
  errorReporter.setupGlobalErrorHandling();
}