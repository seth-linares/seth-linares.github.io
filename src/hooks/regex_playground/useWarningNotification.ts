// src/hooks/regex_playground/useWarningNotification.ts
import { useEffect, useRef, useState, useCallback } from 'react';

function warningsChanged(prev: string[], next: string[]): boolean {
    if (prev.length !== next.length) return true;
    return next.some((w, i) => w !== prev[i]);
}

export function useWarningNotification(warnings: string[], autoDismissMs = 4000) {
    const [prevWarnings, setPrevWarnings] = useState<string[]>(warnings);
    const [toastTrigger, setToastTrigger] = useState(0);
    const [dismissedTrigger, setDismissedTrigger] = useState(0);
    const [toastWarnings, setToastWarnings] = useState<string[]>([]);
    const [hasRenderedOnce, setHasRenderedOnce] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (warningsChanged(prevWarnings, warnings)) {
        setPrevWarnings(warnings);

        if (warnings.length > 0 && hasRenderedOnce) {
            setToastWarnings(warnings);
            setToastTrigger((t) => t + 1);
        }
    }

    if (!hasRenderedOnce) {
        setHasRenderedOnce(true);
    }

    const showToast = toastTrigger > dismissedTrigger;

    const dismissToast = useCallback(() => {
        setDismissedTrigger((d) => d + 1);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (showToast) {
            // Clear any existing timer
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            // Auto-dismiss after delay
            timerRef.current = setTimeout(() => {
                setDismissedTrigger((d) => d + 1);
                timerRef.current = null;
            }, autoDismissMs);
        }

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
