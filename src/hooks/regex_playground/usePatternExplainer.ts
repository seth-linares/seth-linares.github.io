// src/hooks/regex_playground/usePatternExplainer.ts
import { useEffect, useState } from "react";
import type { PatternToken } from "@/types/regex";
import { parseRegexPattern } from "@/utils/regex/regexParser";

export function usePatternExplainer(pattern: string) {
  const [tokens, setTokens] = useState<PatternToken[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pattern) {
      setTokens([]);
      setError(null);
      return;
    }
    try {
      const parsed = parseRegexPattern(pattern);
      setTokens(parsed);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to parse pattern");
      setTokens([]);
    }
  }, [pattern]);

  return { tokens, error };
}
