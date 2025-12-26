// src/components/regex_playground/PatternExplainer.tsx
import type { PatternToken } from "@/types/regex";
import { motion } from "motion/react";
import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  getSimpleDescription,
  getDescriptionExample,
  getDescriptionTip,
} from "@/utils/regex/beginnerDescriptions";

// Tooltip component that renders via portal
function TokenTooltip({
  token,
  targetRef,
  isVisible,
}: {
  token: PatternToken;
  targetRef: React.RefObject<HTMLSpanElement | null>;
  isVisible: boolean;
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const simpleDesc = getSimpleDescription(token);
  const example = getDescriptionExample(token);
  const tip = getDescriptionTip(token);

  // Calculate position in effect, not during render
  useLayoutEffect(() => {
    if (isVisible && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    } else {
      setPosition(null);
    }
  }, [isVisible, targetRef]);

  if (!isVisible || !position) return null;

  return createPortal(
    <div
      className="fixed px-3 py-2 bg-base-300 rounded-lg shadow-xl text-xs max-w-xs pointer-events-none border border-base-content/20"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
    >
      {/* Arrow pointing up */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-base-300" />
      <div className="font-medium text-sm">{simpleDesc}</div>
      {example && <div className="opacity-70 mt-1">{example}</div>}
      {tip && <div className="text-accent mt-1 font-medium">Tip: {tip}</div>}
    </div>,
    document.body
  );
}

// Token with hover tooltip
function TokenWithTooltip({
  token,
  idx,
}: {
  token: PatternToken;
  idx: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <>
      <span
        key={`${token.type}-${token.start}-${idx}`}
        className="relative inline-block hover:scale-[1.08] transition-transform duration-150"
      >
        <span
          ref={ref}
          className={`px-1.5 py-0.5 rounded cursor-help inline-block ${getTokenColorClass(token.type)}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {token.value}
        </span>
      </span>
      <TokenTooltip token={token} targetRef={ref} isVisible={isHovered} />
    </>
  );
}

interface PatternExplainerProps {
  pattern: string;
  tokens: PatternToken[];
}

// Color legend configuration
const TOKEN_LEGEND = [
  { type: "literal", color: "bg-primary/20", label: "Exact text", example: "abc" },
  { type: "escape", color: "bg-secondary/20", label: "Special code", example: "\\d \\w" },
  { type: "quantifier", color: "bg-accent/20", label: "How many", example: "+ * ?" },
  {
    type: "character-class",
    color: "bg-warning/20",
    label: "One of set",
    example: "[a-z]",
  },
  { type: "group", color: "bg-info/20", label: "Group", example: "(...)" },
  { type: "anchor", color: "bg-error/20", label: "Position", example: "^ $" },
  { type: "alternation", color: "bg-purple-400/20", label: "OR", example: "|" },
  { type: "wildcard", color: "bg-base-content/10", label: "Any char", example: "." },
] as const;

// Map token type to color class
function getTokenColorClass(type: string): string {
  const found = TOKEN_LEGEND.find((l) => l.type === type);
  return found?.color ?? "bg-base-content/10";
}

export default function PatternExplainer({
  pattern,
  tokens,
}: PatternExplainerProps) {
  const [showLegend, setShowLegend] = useState(true);
  const [showTokenList, setShowTokenList] = useState(true);

  return (
    <div className="card bg-linear-to-br from-base-200 to-base-300 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between gap-2">
          <h2 className="card-title text-primary">Pattern Breakdown</h2>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setShowLegend(!showLegend)}
          >
            {showLegend ? "Hide" : "Show"} Legend
          </button>
        </div>

        {/* Collapsible Color Legend */}
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 py-2 border-b border-base-300 mb-2"
          >
            {TOKEN_LEGEND.map((item) => (
              <div
                key={item.type}
                className={`${item.color} px-2 py-1 rounded text-xs flex items-center gap-1`}
              >
                <span className="font-medium">{item.label}</span>
                <code className="opacity-70">{item.example}</code>
              </div>
            ))}
          </motion.div>
        )}

        <div className="text-xs opacity-70 -mt-1 mb-2">
          <span className="mr-2">Pattern:</span>
          <code className="font-mono break-all">{pattern}</code>
        </div>

        {/* Visual pattern with hover states and beginner tooltips */}
        <div className="font-mono text-lg p-4 bg-base-100 rounded-lg overflow-x-auto">
          <div className="flex flex-wrap gap-0.5 py-2">
            {tokens.map((token, idx) => (
              <TokenWithTooltip key={`${token.type}-${token.start}-${idx}`} token={token} idx={idx} />
            ))}
          </div>
        </div>

        {/* Collapsible Token List */}
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm w-full justify-between"
            onClick={() => setShowTokenList(!showTokenList)}
          >
            <span className="text-xs opacity-70">
              {tokens.length} token{tokens.length !== 1 ? "s" : ""} - Detailed breakdown
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showTokenList ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showTokenList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 space-y-2"
            >
              {tokens.map((token, idx) => {
                const simpleDesc = getSimpleDescription(token);
                const example = getDescriptionExample(token);
                const tip = getDescriptionTip(token);

                return (
                  <motion.div
                    key={`list-${token.type}-${token.start}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`p-3 rounded ${getTokenColorClass(token.type)}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono font-bold">{token.value}</code>
                      <span className="badge badge-sm badge-ghost">{token.type}</span>
                    </div>
                    <p className="text-sm">{simpleDesc}</p>
                    {example && (
                      <p className="text-xs opacity-70 mt-1 italic">Example: {example}</p>
                    )}
                    {tip && (
                      <p className="text-xs text-accent-content mt-1 font-medium">Tip: {tip}</p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
