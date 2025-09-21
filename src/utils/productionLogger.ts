// Production-ready logger to replace all console.log usage
import { logger } from './logger';

// Production-safe console replacement
export const productionConsole = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(message, data);
    } else {
      logger.debug(message, data);
    }
  },
  
  error: (message: string, data?: any) => {
    console.error(message, data); // Always log errors
    logger.error(message, data);
  },
  
  warn: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.warn(message, data);
    } else {
      logger.warn(message, data);
    }
  },
  
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.debug(message, data);
    } else {
      logger.debug(message, data);
    }
  },
  
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.info(message, data);
    } else {
      logger.info(message, data);
    }
  }
};

// Helper to replace console usage across the app
export const replaceConsoleWithLogger = () => {
  if (!import.meta.env.DEV) {
    // In production, override console methods to use logger
    window.console.log = productionConsole.log;
    window.console.warn = productionConsole.warn;
    window.console.debug = productionConsole.debug;
    window.console.info = productionConsole.info;
    // Keep console.error as is for critical issues
  }
};
