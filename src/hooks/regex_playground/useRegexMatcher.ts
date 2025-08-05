// src/hooks/regex_playground/useRegexMatcher.ts

import { useEffect, useMemo, useState } from 'react';
import type { MatchResult, RegexFlags, SingleMatch } from '@/types/regex';

const REGEX_TIMEOUT_MS = 1000; // 1 second timeout
const MAX_INPUT_LENGTH = 10000; // 10k chars max

// Simple ReDoS detection for common patterns
function isPotentiallyDangerous(pattern: string): boolean {
  const dangerous = [
    /(\w+\+)+/,     // Nested quantifiers
    /(\w+\*)+/,     // Nested quantifiers
    /(.*)*$/,       // Catastrophic backtracking
    /(\w+){10,}/,   // Large repetitions
  ];
  try {
    return dangerous.some((d) => d.test(pattern));
  } catch {
    return false;
  }
}

/**
 * Debounce helper
 */
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const MAX_MATCHES_PER_STRING = 1000; // safety cap
const MAX_CHARS_PER_STRING = 200_000; // safety cap against catastrophic inputs

function flagsToString(flags: RegexFlags): string {
  return [
    flags.g ? 'g' : '',
    flags.i ? 'i' : '',
    flags.m ? 'm' : '',
    flags.s ? 's' : '',
    flags.u ? 'u' : '',
    flags.y ? 'y' : '',
  ].join('');
}

export function safeSubstring(input: string, maxLen: number): { text: string; truncated: boolean } {
  if (input.length <= maxLen) return { text: input, truncated: false };
  return { text: input.slice(0, maxLen), truncated: true };
}

export const useRegexMatcher = (pattern: string, flags: RegexFlags, testStrings: string[]) => {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Track global active index and a map of global indices for components to consume (no hook logic in components)
  const [activeGlobalIndex, setActiveGlobalIndex] = useState<number>(0);
  const [globalIndexMap, setGlobalIndexMap] = useState<Record<string, number>>({});

  const debouncedPattern = useDebounce(pattern, 300);
  const debouncedTests = useDebounce(testStrings, 300);
  const flagsStr = useMemo(() => flagsToString(flags), [flags]);

  const regex = useMemo(() => {
    if (!debouncedPattern) return null;
    try {
      return new RegExp(debouncedPattern, flagsStr);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid pattern';
      setError(errorMessage);
      return null;
    }
  }, [debouncedPattern, flagsStr]);

  useEffect(() => {
    if (!debouncedPattern) {
      setResults([]);
      setError(null);
      return;
    }
    if (!regex) {
      setResults([]);
      return;
    }

    // Add safety checks
    if (isPotentiallyDangerous(debouncedPattern)) {
      setError('Warning: This pattern may cause performance issues');
    }
    setError(null);

    const out: MatchResult[] = [];

    for (let i = 0; i < debouncedTests.length; i++) {
      const original = debouncedTests[i] ?? '';
      const { text: limitedInput, truncated: textTruncatedByGlobalCap } = safeSubstring(original, MAX_CHARS_PER_STRING);

      // Limit input length for safety feature (Phase 4)
      const safeText = limitedInput.length > MAX_INPUT_LENGTH
        ? limitedInput.slice(0, MAX_INPUT_LENGTH)
        : limitedInput;
      const lengthTruncated = limitedInput.length > MAX_INPUT_LENGTH;

      // Clone a new regex for each test string because lastIndex changes with /g or /y
      const local = new RegExp(regex.source, regex.flags);
      const matches: SingleMatch[] = [];
      let count = 0;
      let m: RegExpExecArray | null;

      try {
        // For non-global/non-sticky regex, exec() does not advance across the string.
        // We'll detect global-like behavior and handle iteration accordingly.
        const isGlobalLike = (local as RegExp).global || ('sticky' in local && (local as RegExp & { sticky: boolean }).sticky === true);

        const startTime = Date.now();
        while ((m = local.exec(safeText)) !== null) {
          // Check timeout
          if (Date.now() - startTime > REGEX_TIMEOUT_MS) {
            setError('Pattern execution timeout - pattern may be too complex');
            break;
          }
          // m is non-null inside this loop
          const mm = m as RegExpExecArray & { groups?: Record<string, string>; indices?: number[][] };
          const fullMatch = mm[0] ?? '';
          const start = mm.index;
          const end = start + fullMatch.length;

          const groups = Array.from({ length: Math.max(0, mm.length - 1) }, (_, gi) => {
            const val = mm[gi + 1] ?? '';
            // Named groups are on mm.groups if available
            const name = mm.groups ? Object.keys(mm.groups)[gi] : undefined;
            const hasIndices = typeof mm.indices === 'object' && !!mm.indices;
            const grpStart = hasIndices && mm.indices?.[gi + 1] ? mm.indices[gi + 1][0] : -1;
            const grpEnd = hasIndices && mm.indices?.[gi + 1] ? mm.indices[gi + 1][1] : -1;
            return {
              name,
              value: val,
              start: grpStart,
              end: grpEnd,
            };
          });

          matches.push({
            fullMatch,
            start,
            end,
            groups,
          });

          count++;
          if (count >= MAX_MATCHES_PER_STRING) break;

          // If the regex is NOT global or sticky, stop after the first match.
          // exec() without /g or /y will always return the first match and then null on subsequent calls,
          // but lastIndex manipulation has no effect. To be safe, break explicitly.
          if (!isGlobalLike) {
            break;
          }

          // Safety against zero-length infinite loops: advance lastIndex on zero-length or stagnant matches
          if (mm[0] === '' || local.lastIndex === mm.index) {
            // For zero-length matches, manually advance to prevent infinite loop
            local.lastIndex = Math.max(mm.index + 1, local.lastIndex + 1);

            // If we've gone past the string length, break
            if (local.lastIndex > safeText.length) {
              break;
            }
          }
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Error while executing regex';
        setError(errorMessage);
        out.length = 0;
        break;
      }

      out.push({
        testStringIndex: i,
        matches,
        totalMatches: count,
        truncated: textTruncatedByGlobalCap || lengthTruncated || count >= MAX_MATCHES_PER_STRING,
      });
    }

    setResults(out);
  }, [debouncedPattern, debouncedTests, regex]);

  // Build a map from (testStringIndex, matchIndex) => globalIndex so UI can emphasize the active match
  useEffect(() => {
    const map: Record<string, number> = {};
    let base = 0;
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      for (let j = 0; j < res.matches.length; j++) {
        map[`${res.testStringIndex}-${j}`] = base + j;
      }
      base += res.matches.length;
    }
    setGlobalIndexMap(map);

    // Ensure active index stays within bounds
    const total = results.reduce((acc, r) => acc + r.matches.length, 0);
    if (total === 0) {
      setActiveGlobalIndex(0);
    } else if (activeGlobalIndex >= total) {
      setActiveGlobalIndex(total - 1);
    }
  }, [results, activeGlobalIndex]);

  return { matches: results, error, activeGlobalIndex, setActiveGlobalIndex, globalIndexMap };
};
