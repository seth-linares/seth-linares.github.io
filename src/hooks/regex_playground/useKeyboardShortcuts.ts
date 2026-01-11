// src/hooks/regex_playground/useKeyboardShortcuts.ts
import { useEffect, useRef } from 'react';

interface ShortcutHandlers {
    onTest?: () => void;
    onFocusPattern?: () => void;
    onSave?: () => void;
    onReset?: () => void;
    onPrevMatch?: () => void;
    onNextMatch?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
    const handlersRef = useRef(handlers);

    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handlersRef.current.onTest?.();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                handlersRef.current.onFocusPattern?.();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handlersRef.current.onSave?.();
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                handlersRef.current.onReset?.();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
                e.preventDefault();
                handlersRef.current.onPrevMatch?.();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
                e.preventDefault();
                handlersRef.current.onNextMatch?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}
