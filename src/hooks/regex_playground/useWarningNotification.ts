// src/hooks/regex_playground/useWarningNotification.ts
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useWarningNotification
 * Manages toast notification state for regex warnings.
 * Shows toast when new warnings appear, auto-dismisses after delay.
 */
export function useWarningNotification(
  warnings: string[],
  autoDismissMs = 4000
) {
  const [showToast, setShowToast] = useState(false);
  const [toastWarnings, setToastWarnings] = useState<string[]>([]);
  const prevWarningsRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    setShowToast(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const prevWarnings = prevWarningsRef.current;

    // Check if there are new warnings (not just same warnings)
    const hasNewWarnings =
      warnings.length > 0 &&
      (warnings.length !== prevWarnings.length ||
        warnings.some((w, i) => w !== prevWarnings[i]));

    // Only show toast if we went from no warnings (or different warnings) to having warnings
    // Don't show on initial mount with empty warnings
    if (hasNewWarnings && prevWarnings.length >= 0) {
      setToastWarnings(warnings);
      setShowToast(true);

      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Auto-dismiss after delay
      timerRef.current = setTimeout(() => {
        setShowToast(false);
        timerRef.current = null;
      }, autoDismissMs);
    }

    // Update ref for next comparison
    prevWarningsRef.current = warnings;

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [warnings, autoDismissMs]);

  return {
    showToast,
    toastWarnings,
    dismissToast,
  };
}
