// src/hooks/regex_playground/usePatternExplainer.ts
import { useEffect, useState } from "react";
import type { PatternToken, RegexFlags } from "@/types/regex";
import { parseRegexPattern } from "@/utils/regex/regexParser";

export function usePatternExplainer(pattern: string, flags?: Partial<RegexFlags>) {
  const [tokens, setTokens] = useState<PatternToken[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pattern) {
      setTokens([]);
      setError(null);
      return;
    }
    try {
      const parsed = parseRegexPattern(pattern, flags);
      setTokens(parsed);
      setError(null);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to parse pattern";
      setError(errorMessage);
      setTokens([]);
    }
  }, [pattern, flags]);

  return { tokens, error };
}
