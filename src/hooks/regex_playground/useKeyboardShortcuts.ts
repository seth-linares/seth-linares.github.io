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
            // Don't trigger shortcuts when user is typing in inputs
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            // Ctrl/Cmd + Enter - Test pattern
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handlersRef.current.onTest?.();
            }

            // Ctrl/Cmd + / - Focus pattern input
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                handlersRef.current.onFocusPattern?.();
            }

            // Ctrl/Cmd + S - Save pattern (if implemented)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handlersRef.current.onSave?.();
            }

            // Ctrl/Cmd + Shift + R - Reset
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                handlersRef.current.onReset?.();
            }

            // Ctrl/Cmd + Left/Right Arrow - Navigate matches
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
