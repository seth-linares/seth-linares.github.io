// src/hooks/regex_playground/useWarningNotification.ts
import { useEffect, useRef, useState, useCallback } from "react";

// Helper to check if warnings arrays are different
function warningsChanged(prev: string[], next: string[]): boolean {
  if (prev.length !== next.length) return true;
  return next.some((w, i) => w !== prev[i]);
}

/**
 * useWarningNotification
 * Manages toast notification state for regex warnings.
 * Shows toast when new warnings appear, auto-dismisses after delay.
 *
 * Uses React's "Storing information from previous renders" pattern
 * with useState to properly track previous values during render.
 */
export function useWarningNotification(
  warnings: string[],
  autoDismissMs = 4000
) {
  // Track previous warnings using useState (React's recommended pattern)
  const [prevWarnings, setPrevWarnings] = useState<string[]>(warnings);
  // Track when toast was triggered (increment to show new toast)
  const [toastTrigger, setToastTrigger] = useState(0);
  // Track if toast has been dismissed (resets when new toast triggers)
  const [dismissedTrigger, setDismissedTrigger] = useState(0);
  // Store the warnings that triggered the current toast
  const [toastWarnings, setToastWarnings] = useState<string[]>([]);
  // Track if this is the first render (to avoid showing toast on mount)
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect changes during render using React's "Storing information from previous renders" pattern
  if (warningsChanged(prevWarnings, warnings)) {
    setPrevWarnings(warnings);

    // Only show toast if we have new warnings and this isn't the initial render
    if (warnings.length > 0 && hasRenderedOnce) {
      setToastWarnings(warnings);
      setToastTrigger(t => t + 1);
    }
  }

  // Mark first render complete
  if (!hasRenderedOnce) {
    setHasRenderedOnce(true);
  }

  // Derive visibility: shown if triggered and not yet dismissed
  const showToast = toastTrigger > dismissedTrigger;

  const dismissToast = useCallback(() => {
    setDismissedTrigger(d => d + 1);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Effect only for timer side-effect (external system)
  useEffect(() => {
    if (showToast) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Auto-dismiss after delay
      timerRef.current = setTimeout(() => {
        setDismissedTrigger(d => d + 1);
        timerRef.current = null;
      }, autoDismissMs);
    }

    // Cleanup timer on unmount or when toast hides
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toastTrigger, autoDismissMs, showToast]);

  return {
    showToast,
    toastWarnings,
    dismissToast,
  };
}
