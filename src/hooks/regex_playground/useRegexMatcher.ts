// src/hooks/regex_playground/useRegexMatcher.ts

import { useMemo } from 'react';
import type { MatchResult, RegexFlags, SingleMatch } from '@/types/regex';
import { flagsToString } from '@/types/regex';

const REGEX_TIMEOUT_MS = 1000;
const MAX_INPUT_LENGTH = 10000;
const MAX_MATCHES_PER_STRING = 1000;
const MAX_CHARS_PER_STRING = 200_000;

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
        const { text: limitedInput, truncated: textTruncatedByGlobalCap } = safeSubstring(
            original,
            MAX_CHARS_PER_STRING
        );

        const safeText =
            limitedInput.length > MAX_INPUT_LENGTH
                ? limitedInput.slice(0, MAX_INPUT_LENGTH)
                : limitedInput;
        const lengthTruncated = limitedInput.length > MAX_INPUT_LENGTH;

        const local = new RegExp(regex.source, regex.flags);
        const matches: SingleMatch[] = [];
        let count = 0;
        let m: RegExpExecArray | null;

        try {
            const isGlobalLike =
                (local as RegExp).global ||
                ('sticky' in local && (local as RegExp & { sticky: boolean }).sticky === true);

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
                const mm = m as RegExpExecArray & {
                    groups?: Record<string, string>;
                    indices?: number[][];
                };
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
                    const grpStart =
                        hasIndices && mm.indices?.[gi + 1] ? mm.indices[gi + 1][0] : -1;
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

                if (!isGlobalLike) {
                    break;
                }

                if (mm[0] === '' || local.lastIndex === mm.index) {
                    local.lastIndex = Math.max(mm.index + 1, local.lastIndex + 1);

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
            truncated:
                textTruncatedByGlobalCap || lengthTruncated || count >= MAX_MATCHES_PER_STRING,
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

    const { results, executionError } = useMemo(() => {
        if (!pattern || !regex) {
            return { results: [] as MatchResult[], executionError: null };
        }

        const { results, executionError } = executeRegexMatching(regex, testStrings);
        return { results, executionError };
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

    const error = regexError ?? executionError ?? null;

    return {
        matches: results,
        error,
        totalMatches,
        globalIndexMap,
    };
};
