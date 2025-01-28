// src/hooks/useDebounce.ts

import { useEffect, useCallback, useRef } from 'react';

// This is where we define our custom hook for debouncing

export function useDebounce<Args extends unknown[], Return>(
  callback: (...args: Args) => Return,
  delay: number
): (...args: Args) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Args) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

// Optional: Create a version specifically for scroll events with RAF
export function useDebounceRAF<Args extends unknown[], Return>(
  callback: (...args: Args) => Return
): (...args: Args) => void {
  const frameRef = useRef<number>();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Args) => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        callbackRef.current(...args);
      });
    },
    []
  );
}