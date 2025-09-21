// Production-ready logging utility
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  component?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    // In development, only log warnings and errors to reduce noise
    return level === 'warn' || level === 'error';
  }

  private addLog(level: LogLevel, message: string, data?: any, component?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      component,
    };

    this.logs.unshift(entry);
    
    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Only actually console.log in development or for critical errors
    if (this.shouldLog(level)) {
      const prefix = component ? `[${component}]` : '';
      switch (level) {
        case 'debug':
          if (this.isDevelopment) console.debug(`🔍 ${prefix}`, message, data);
          break;
        case 'info':
          if (this.isDevelopment) console.info(`ℹ️ ${prefix}`, message, data);
          break;
        case 'warn':
          console.warn(`⚠️ ${prefix}`, message, data);
          break;
        case 'error':
          console.error(`❌ ${prefix}`, message, data);
          // In production, send to error reporting service
          if (!this.isDevelopment) {
            this.reportError(message, data, component);
          }
          break;
      }
    }
  }

  private async reportError(message: string, data?: any, component?: string): Promise<void> {
    // In a real app, this would send to Sentry, LogRocket, etc.
    // For now, just ensure critical errors are visible
    if (typeof window !== 'undefined' && 'navigator' in window && 'sendBeacon' in navigator) {
      try {
        const { ENV } = await import('@/config/environment');
        const errorData = {
          message,
          data: JSON.stringify(data),
          component,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        };
        
        // Send to error reporting endpoint
        navigator.sendBeacon(`${ENV.API_BASE_URL}/api/errors`, JSON.stringify(errorData));
      } catch (e) {
        // Fallback if beacon fails
        console.error('Failed to report error:', e);
      }
    }
  }

  debug(message: string, data?: any, component?: string): void {
    this.addLog('debug', message, data, component);
  }

  info(message: string, data?: any, component?: string): void {
    this.addLog('info', message, data, component);
  }

  warn(message: string, data?: any, component?: string): void {
    this.addLog('warn', message, data, component);
  }

  error(message: string, data?: any, component?: string): void {
    this.addLog('error', message, data, component);
  }

  getLogs(level?: LogLevel, component?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (component && log.component !== component) return false;
      return true;
    });
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();

// Convenience functions for different components
export const createComponentLogger = (component: string) => ({
  debug: (message: string, data?: any) => logger.debug(message, data, component),
  info: (message: string, data?: any) => logger.info(message, data, component),
  warn: (message: string, data?: any) => logger.warn(message, data, component),
  error: (message: string, data?: any) => logger.error(message, data, component),
});