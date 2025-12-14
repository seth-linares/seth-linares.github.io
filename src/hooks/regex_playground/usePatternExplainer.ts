// src/hooks/regex_playground/usePatternExplainer.ts
import { useMemo } from "react";
import type { PatternToken, RegexFlags } from "@/types/regex";
import { parseRegexPatternWithWarnings } from "@/utils/regex/regexParser";

export function usePatternExplainer(pattern: string, flags?: Partial<RegexFlags>) {
  const { tokens, warnings, error } = useMemo(() => {
    if (!pattern) return { tokens: [] as PatternToken[], warnings: [] as string[], error: null };
    try {
      const result = parseRegexPatternWithWarnings(pattern, flags);
      return { tokens: result.tokens, warnings: result.warnings, error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to parse pattern";
      return { tokens: [] as PatternToken[], warnings: [] as string[], error: msg };
    }
  }, [pattern, flags]);

  return { tokens, warnings, error };
}
