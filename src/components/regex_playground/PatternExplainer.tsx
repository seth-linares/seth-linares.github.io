// src/components/regex_playground/PatternExplainer.tsx
import type { PatternToken } from "@/types/regex";
import { motion } from "motion/react";

interface PatternExplainerProps {
  pattern: string;
  tokens: PatternToken[];
}

export default function PatternExplainer({ pattern, tokens }: PatternExplainerProps) {
  return (
    <div className="card bg-linear-to-br from-base-200 to-base-300 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-primary">Pattern Breakdown</h2>
        <div className="text-xs opacity-70 -mt-1 mb-2">
          <span className="mr-2">Pattern:</span>
          <code className="font-mono break-all">{pattern}</code>
        </div>

        {/* Visual pattern with hover states */}
        <div className="font-mono text-lg p-4 bg-base-100 rounded-lg overflow-x-auto">
          {tokens.map((token, idx) => (
            <motion.span
              key={`${token.type}-${token.start}-${idx}`}
              className="relative inline-block mr-0.5 my-0.5"
              whileHover={{ scale: 1.08 }}
            >
              <span
                className={[
                  "px-1 rounded cursor-help inline-block",
                  token.type === "literal" ? "bg-primary/20" : "",
                  token.type === "escape" ? "bg-secondary/20" : "",
                  token.type === "quantifier" ? "bg-accent/20" : "",
                  token.type === "character-class" ? "bg-warning/20" : "",
                  token.type === "group" ? "bg-info/20" : "",
                  token.type === "anchor" ? "bg-error/20" : "",
                  token.type === "alternation" ? "bg-purple-400/20" : "",
                  token.type === "wildcard" ? "bg-base-content/10" : "",
                ].join(" ")}
                title={token.description}
              >
                {token.value}
              </span>

              {/* Tooltip using DaisyUI */}
              <div className="tooltip tooltip-top" data-tip={token.description}>
                <span className="sr-only">Info</span>
              </div>
            </motion.span>
          ))}
        </div>

        {/* Token list */}
        <div className="mt-4 space-y-2">
          {tokens.map((token, idx) => (
            <motion.div
              key={`list-${token.type}-${token.start}-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-3 p-2 rounded bg-base-100"
            >
              <span className="badge badge-sm">{token.type}</span>
              <code className="text-sm">{token.value}</code>
              <span className="text-xs opacity-70 flex-1">{token.description}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
