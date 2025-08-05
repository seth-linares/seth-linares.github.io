// src/hooks/regex_playground/useKeyboardShortcuts.ts
import { useEffect } from 'react';

interface ShortcutHandlers {
  onTest?: () => void;
  onFocusPattern?: () => void;
  onSave?: () => void;
  onReset?: () => void;
  onCopy?: () => void;
  onPrevMatch?: () => void;
  onNextMatch?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // Ctrl/Cmd + Enter - Test pattern
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlers.onTest?.();
      }
      
      // Ctrl/Cmd + / - Focus pattern input
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        handlers.onFocusPattern?.();
      }
      
      // Ctrl/Cmd + S - Save pattern (if implemented)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
      }
      
      // Ctrl/Cmd + Shift + R - Reset
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        handlers.onReset?.();
      }
      
      // Ctrl/Cmd + C - Copy generated code (when not in input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Let default copy work in inputs, but intercept when not in inputs
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handlers.onCopy?.();
        }
      }
      
      // Ctrl/Cmd + Left/Right Arrow - Navigate matches
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlers.onPrevMatch?.();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        handlers.onNextMatch?.();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}