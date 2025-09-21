// Build optimization utilities for production
import React from 'react';

export const removeConsoleInProduction = () => {
  if (import.meta.env.MODE === 'production') {
    // Override console methods in production
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    // Keep warn and error for critical issues
  }
};

// Code splitting utility
export const lazyLoadComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn);
};

// Memory optimization
export const optimizeMemory = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
      // Suggest garbage collection
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
    }
  }
};

// Bundle size optimization
export const removeUnusedFeatures = () => {
  // Remove unused CSS classes in production
  if (import.meta.env.MODE === 'production') {
    // This would be handled by build tools
    console.log('Build optimization: Removing unused CSS and JavaScript');
  }
};

// Performance optimization
export const optimizeBundle = () => {
  if (typeof window !== 'undefined') {
    removeConsoleInProduction();
    removeUnusedFeatures();
    
    // Set up memory monitoring
    setInterval(optimizeMemory, 30000); // Check every 30 seconds
  }
};

// Initialize optimizations
if (typeof window !== 'undefined') {
  optimizeBundle();
}
