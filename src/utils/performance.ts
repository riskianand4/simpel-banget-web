// Performance utilities for React optimizations
import { useRef, useCallback, useMemo, useState, useEffect } from 'react';

// Throttle hook for high-frequency events
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(0);
  
  return useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      lastRun.current = now;
      return callback(...args);
    }
  }, [callback, delay]) as T;
};

// Debounce hook for input handling
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as T;
};

// Memoization helper for expensive calculations
export const useMemoizedValue = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};

// Virtual scrolling helper
export const useVirtualScrolling = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const bufferSize = Math.min(5, Math.floor(visibleCount * 0.5));
    
    return {
      visibleCount,
      bufferSize,
      totalHeight: itemCount * itemHeight,
    };
  }, [itemCount, itemHeight, containerHeight]);
};

// Image lazy loading with Intersection Observer
export const useLazyImage = (src: string, threshold = 0.1) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const imageSrc = isInView ? src : '';

  return {
    imgRef,
    src: imageSrc,
    isLoaded,
    onLoad: () => setIsLoaded(true),
  };
};