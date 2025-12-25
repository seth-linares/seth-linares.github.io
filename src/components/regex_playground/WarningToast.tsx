// src/components/regex_playground/WarningToast.tsx
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

interface WarningToastProps {
  warnings: string[];
  visible: boolean;
  onDismiss: () => void;
}

export default function WarningToast({
  warnings,
  visible,
  onDismiss,
}: WarningToastProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {visible && warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
          role="alert"
          aria-live="polite"
        >
          <div className="alert alert-warning shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex flex-col gap-1">
              {warnings.map((warning, idx) => (
                <span key={idx} className="text-sm">
                  {warning}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={onDismiss}
              aria-label="Dismiss warning"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
