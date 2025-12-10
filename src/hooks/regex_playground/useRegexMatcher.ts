// src/hooks/regex_playground/useRegexMatcher.ts

import { useMemo } from 'react';
import type { MatchResult, RegexFlags, SingleMatch } from '@/types/regex';
import { flagsToString } from '@/types/regex';

const REGEX_TIMEOUT_MS = 1000; // 1 second timeout
const MAX_INPUT_LENGTH = 10000; // 10k chars max

// Conservative ReDoS detection - only flags patterns that are DEFINITELY dangerous
function isPotentiallyDangerous(pattern: string): boolean {
  const dangerous = [
    /\([^)]*[+*]\)\s*[+*]/,           // Nested quantifiers: (x+)+ or (x*)*
    /\([^)]*[+*]\)\s*\{[0-9,]+\}/,    // Nested with range: (x+){2,}
    /\(\.\*\)\s*[+*]/,                 // Explicit (.*)+
  ];
  try {
    return dangerous.some((d) => d.test(pattern));
  } catch {
    return false;
  }
}

const MAX_MATCHES_PER_STRING = 1000; // safety cap
const MAX_CHARS_PER_STRING = 200_000; // safety cap against catastrophic inputs

export function safeSubstring(input: string, maxLen: number): { text: string; truncated: boolean } {
  if (input.length <= maxLen) return { text: input, truncated: false };
  return { text: input.slice(0, maxLen), truncated: true };
}

function executeRegexMatching(
  regex: RegExp,
  debouncedTests: string[]
): { results: MatchResult[]; executionError: string | null } {
  const out: MatchResult[] = [];
  let executionError: string | null = null;

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
      let iterations = 0;
      const MAX_ITERATIONS = 10000;

      while ((m = local.exec(safeText)) !== null) {
        iterations++;
        if (iterations > MAX_ITERATIONS) {
          executionError = 'Too many iterations - pattern may cause infinite loop';
          break;
        }
        // Check timeout
        if (Date.now() - startTime > REGEX_TIMEOUT_MS) {
          executionError = 'Pattern execution timeout - pattern may be too complex';
          break;
        }
        // m is non-null inside this loop
        const mm = m as RegExpExecArray & { groups?: Record<string, string>; indices?: number[][] };
        const fullMatch = mm[0] ?? '';
        const start = mm.index;
        const end = start + fullMatch.length;

        const groups = Array.from({ length: Math.max(0, mm.length - 1) }, (_, gi) => {
          const val = mm[gi + 1] ?? '';
          let name: string | undefined;
          if (mm.groups) {
            for (const [groupName, groupValue] of Object.entries(mm.groups)) {
              if (groupValue === val) {
                name = groupName;
                break;
              }
            }
          }
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
      executionError = errorMessage;
      return { results: [], executionError };
    }

    out.push({
      testStringIndex: i,
      matches,
      totalMatches: count,
      truncated: textTruncatedByGlobalCap || lengthTruncated || count >= MAX_MATCHES_PER_STRING,
    });
  }

  return { results: out, executionError };
}

export const useRegexMatcher = (pattern: string, flags: RegexFlags, testStrings: string[]) => {
  const flagsStr = useMemo(() => flagsToString(flags), [flags]);

  const { regex, regexError } = useMemo(() => {
    if (!pattern) return { regex: null, regexError: null };
    try {
      return { regex: new RegExp(pattern, flagsStr), regexError: null };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid pattern';
      return { regex: null, regexError: errorMessage };
    }
  }, [pattern, flagsStr]);

  const { results, executionError, dangerWarning } = useMemo(() => {
    if (!pattern || !regex) {
      return { results: [] as MatchResult[], executionError: null, dangerWarning: null };
    }

    const dangerWarning = isPotentiallyDangerous(pattern)
      ? 'Warning: This pattern may cause performance issues'
      : null;

    const { results, executionError } = executeRegexMatching(regex, testStrings);
    return { results, executionError, dangerWarning };
  }, [pattern, testStrings, regex]);

  const globalIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    let base = 0;
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      for (let j = 0; j < res.matches.length; j++) {
        map[`${res.testStringIndex}-${j}`] = base + j;
      }
      base += res.matches.length;
    }
    return map;
  }, [results]);

  const totalMatches = useMemo(
    () => results.reduce((acc, r) => acc + r.matches.length, 0),
    [results]
  );

  const error = regexError ?? executionError ?? dangerWarning;

  return {
    matches: results,
    error,
    totalMatches,
    globalIndexMap
  };
};
