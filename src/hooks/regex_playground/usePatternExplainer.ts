// src/hooks/regex_playground/usePatternExplainer.ts
import { useMemo } from "react";
import type { PatternToken, RegexFlags } from "@/types/regex";
import { parseRegexPattern } from "@/utils/regex/regexParser";

export function usePatternExplainer(pattern: string, flags?: Partial<RegexFlags>) {
  const { tokens, error } = useMemo(() => {
    if (!pattern) return { tokens: [] as PatternToken[], error: null };
    try {
      return { tokens: parseRegexPattern(pattern, flags), error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to parse pattern";
      return { tokens: [] as PatternToken[], error: msg };
    }
  }, [pattern, flags]);

  return { tokens, error };
}
