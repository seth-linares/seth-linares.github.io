// src/components/regex_playground/WarningIndicator.tsx
import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

interface WarningIndicatorProps {
  warnings: string[];
}

function WarningTooltip({
  warnings,
  targetRef,
  isVisible,
}: {
  warnings: string[];
  targetRef: React.RefObject<HTMLButtonElement | null>;
  isVisible: boolean;
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Calculate position in effect, not during render
  useLayoutEffect(() => {
    if (isVisible && targetRef.current && typeof document !== "undefined") {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    } else {
      setPosition(null);
    }
  }, [isVisible, targetRef]);

  if (!isVisible || !position || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed px-3 py-2 bg-warning text-warning-content rounded-lg shadow-xl text-xs max-w-xs pointer-events-none border border-warning-content/20"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
    >
      {/* Arrow pointing up */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-warning" />
      <div className="font-medium mb-1">Performance Warnings</div>
      <ul className="space-y-1">
        {warnings.map((warning, idx) => (
          <li key={idx} className="flex items-start gap-1">
            <span className="opacity-70">•</span>
            <span>{warning}</span>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
}

export default function WarningIndicator({ warnings }: WarningIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  if (warnings.length === 0) return null;

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="badge badge-warning badge-sm gap-1 cursor-help"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${warnings.length} warning${warnings.length !== 1 ? "s" : ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        {warnings.length}
      </button>
      <WarningTooltip warnings={warnings} targetRef={ref} isVisible={isHovered} />
    </>
  );
}
