// src/utils/performance.ts

/**
 * Utility constants for performance optimization
 */
export const THRESHOLDS = {
    PROGRESS: 0.01,    // Minimum progress change to trigger update
    SCROLL: 1,         // Minimum scroll position change (in pixels)
    DEBOUNCE: 16.67,   // Roughly equals one frame at 60fps
  } as const;
  
  /**
   * Shared interfaces for animated components
   */
  export interface AnimatedSectionProps {
    isVisible: boolean;
    progress: number;
  }
  
  /**
   * Creates an optimized comparison function for React.memo()
   * @param threshold - Minimum progress change to trigger re-render
   */
  export const createPropsAreEqual = (threshold: number = THRESHOLDS.PROGRESS) => {
    return (
      prevProps: AnimatedSectionProps,
      nextProps: AnimatedSectionProps
    ): boolean => {
      // Early return for visibility changes
      if (prevProps.isVisible !== nextProps.isVisible) {
        return false;
      }
  
      // Only check progress if both sections are visible
      if (prevProps.isVisible && nextProps.isVisible) {
        return Math.abs(prevProps.progress - nextProps.progress) < threshold;
      }
  
      // If neither is visible, they're equal
      return true;
    };
  };
  
  /**
   * Performance measurement utility
   */
  export const measurePerformance = (
    name: string,
    callback: () => void,
    shouldLog: boolean = true
  ) => {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performance.mark(startMark);
    callback();
    performance.mark(endMark);
    
    const measurement = performance.measure(name, startMark, endMark);
    
    if (shouldLog) {
      console.log(`${name} took ${measurement.duration.toFixed(2)}ms`);
    }
    
    return measurement.duration;
  };