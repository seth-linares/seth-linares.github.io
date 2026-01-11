// src/hooks/regex_playground/useRegexPlayground.ts

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    CodeGenOptions,
    MatchResult,
    PatternExplanation,
    RegexFlags,
    RegexFlavor,
    RegexPlaygroundState,
} from '@/types/regex';
import { defaultFlags, flagsToString } from '@/types/regex';
import { useRegexMatcher } from './useRegexMatcher';
import { useDebouncedValue } from './useDebouncedValue';
import { parseHashParams, updateHashParams } from '@/utils/hashRouterUrl';
import { createShareableUrl } from '@/utils/hashRouterUrl';

function parseInitialState(): Partial<RegexPlaygroundState> {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const params = parseHashParams(hash);

    const pattern = params.get('pattern') ?? '';
    const flagsStr = params.get('flags') ?? '';
    const testsParam = params.getAll('test');
    const testStrings = testsParam.length ? testsParam : [''];

    const flags: RegexFlags = {
        g: flagsStr.includes('g'),
        i: flagsStr.includes('i'),
        m: flagsStr.includes('m'),
        s: flagsStr.includes('s'),
        u: flagsStr.includes('u'),
        y: flagsStr.includes('y'),
    };

    return { pattern, flags, testStrings };
}

function hasNonDefaultFlags(flags: RegexFlags): boolean {
    return (Object.keys(flags) as (keyof RegexFlags)[]).some(
        (key) => flags[key] !== defaultFlags[key]
    );
}

export function useRegexPlayground() {
    const [pattern, setPattern] = useState('');
    const [flags, setFlags] = useState<RegexFlags>(defaultFlags);
    const [flavor, setFlavor] = useState<RegexFlavor>('javascript');
    const [testStrings, setTestStrings] = useState<string[]>(['']);
    const [explanation, setExplanation] = useState<PatternExplanation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activePatternId, setActivePatternId] = useState<string | null>(null);
    const [activeMatchIndex, setActiveMatchIndex] = useState<number>(-1);
    const [isInitialized, setIsInitialized] = useState(false);

    const debouncedPattern = useDebouncedValue(pattern, 300);
    const debouncedFlags = useDebouncedValue(flags, 300);
    const debouncedTests = useDebouncedValue(testStrings, 300);

    const { matches, error: matchError } = useRegexMatcher(
        debouncedPattern,
        debouncedFlags,
        debouncedTests
    );

    // tool.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        setError(matchError);
    }, [matchError]);

    useEffect(() => {
        if (!isInitialized) return;

        const params = new URLSearchParams();
        if (debouncedPattern) params.set('pattern', debouncedPattern);
        const f = flagsToString(debouncedFlags);
        if (f) params.set('flags', f);
        debouncedTests.forEach((t) => params.append('test', t));

        updateHashParams(params);
    }, [debouncedPattern, debouncedFlags, debouncedTests, isInitialized]);

    useEffect(() => {
        if (isInitialized) return;

        const urlState = parseInitialState();
        const hasUrlParams =
            urlState.pattern ||
            (urlState.testStrings && urlState.testStrings.length > 1) ||
            (urlState.flags && hasNonDefaultFlags(urlState.flags));

        if (hasUrlParams) {
            if (urlState.pattern !== undefined) setPattern(urlState.pattern);
            if (urlState.flags) setFlags(urlState.flags);
            if (urlState.testStrings) setTestStrings(urlState.testStrings);
        } else {
            try {
                const saved = localStorage.getItem('regex_playground_state');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (typeof parsed.pattern === 'string') setPattern(parsed.pattern);
                    if (parsed.flags) setFlags(parsed.flags);
                    if (typeof parsed.flavor === 'string') setFlavor(parsed.flavor);
                    if (Array.isArray(parsed.testStrings)) setTestStrings(parsed.testStrings);
                }
            } catch (error) {
                console.warn('Failed to load regex playground state from localStorage:', error);
            }
        }

        setIsInitialized(true);
    }, [isInitialized]);

    useEffect(() => {
        const handleHashChange = () => {
            if (!isInitialized) return;

            const newState = parseInitialState();
            if (newState.pattern !== undefined) setPattern(newState.pattern);
            if (newState.flags) setFlags(newState.flags);
            if (newState.testStrings) setTestStrings(newState.testStrings);
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [isInitialized]);

    // Local storage persistence
    useEffect(() => {
        if (!isInitialized) return;

        try {
            localStorage.setItem(
                'regex_playground_state',
                JSON.stringify({ pattern, flags, flavor, testStrings })
            );
        } catch (error) {
            console.warn('Failed to save regex playground state to localStorage:', error);
        }
    }, [pattern, flags, flavor, testStrings, isInitialized]);

    const toggleFlag = useCallback((k: keyof RegexFlags) => {
        setFlags((prev) => ({ ...prev, [k]: !prev[k] }));
    }, []);

    const setTestStringAt = useCallback((index: number, value: string) => {
        setTestStrings((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const addTestString = useCallback(() => {
        setTestStrings((prev) => [...prev, '']);
    }, []);

    const removeTestString = useCallback((index: number) => {
        setTestStrings((prev) => prev.filter((_, i) => i !== index));
    }, []);

    useEffect(() => {
        if (!debouncedPattern) {
            setExplanation(null);
            return;
        }
        setExplanation({
            ast: [
                {
                    type: 'pattern',
                    value: debouncedPattern,
                    start: 0,
                    end: debouncedPattern.length,
                },
            ],
            summary: 'Basic pattern preview. Detailed explanation coming in Phase 2.',
        });
    }, [debouncedPattern]);

    const state: RegexPlaygroundState = useMemo(() => {
        return {
            pattern,
            testStrings,
            flags,
            flavor,
            matches: (matches as MatchResult[]) ?? [],
            explanation,
            error,
            activePatternId,
        };
    }, [activePatternId, error, explanation, flavor, flags, matches, pattern, testStrings]);

    // Generate shareable URL
    const shareUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';

        const params = new URLSearchParams();
        if (state.pattern) params.set('pattern', state.pattern);

        const flagsString = [
            state.flags.g ? 'g' : '',
            state.flags.i ? 'i' : '',
            state.flags.m ? 'm' : '',
            state.flags.s ? 's' : '',
            state.flags.u ? 'u' : '',
            state.flags.y ? 'y' : '',
        ].join('');
        if (flagsString) params.set('flags', flagsString);

        state.testStrings.forEach((test) => params.append('test', test));

        return createShareableUrl(params, '/regex-playground');
    }, [state.pattern, state.flags, state.testStrings]);

    const generateJsSnippet = useCallback(
        (opts?: Partial<CodeGenOptions>) => {
            const p = opts?.pattern ?? pattern;
            const f = flagsToString(flags);
            const varName = opts?.testVarName ?? 'text';
            const escaped = p.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
            return [
                'const pattern = new RegExp(`' + escaped + '`, `' + f + '`);',
                `const ${varName} = 'your text here';`,
                'const matches = [];',
                'let m;',
                `while ((m = pattern.exec(${varName})) !== null) {`,
                '  if (m.index === pattern.lastIndex) pattern.lastIndex++;',
                '  matches.push({ full: m[0], index: m.index, groups: m.slice(1) });',
                '}',
                'console.log(matches);',
            ].join('\n');
        },
        [flags, pattern]
    );

    const allMatches = useMemo(() => {
        return state.matches.flatMap((m) =>
            m.matches.map((x, localIdx) => ({
                ...x,
                testStringIndex: m.testStringIndex,
                localIdx,
            }))
        );
    }, [state.matches]);

    useEffect(() => {
        if (!allMatches.length) {
            setActiveMatchIndex(-1);
        } else if (activeMatchIndex >= allMatches.length) {
            setActiveMatchIndex(0);
        }
    }, [allMatches.length, activeMatchIndex]);

    const goPrev = useCallback(() => {
        if (!allMatches.length) return;
        setActiveMatchIndex((prev) => {
            if (prev === -1) return allMatches.length - 1;
            return (prev - 1 + allMatches.length) % allMatches.length;
        });
    }, [allMatches.length]);

    const goNext = useCallback(() => {
        if (!allMatches.length) return;
        setActiveMatchIndex((prev) => {
            if (prev === -1) return 0;
            return (prev + 1) % allMatches.length;
        });
    }, [allMatches.length]);

    useEffect(() => {
        if (activeMatchIndex < 0) return;
        const el = document.querySelector<HTMLElement>(
            `[data-match-global-index="${activeMatchIndex}"]`
        );
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            el.setAttribute('data-focused', 'true');
            window.setTimeout(() => el.removeAttribute('data-focused'), 600);
        }
    }, [activeMatchIndex]);

    // Layout notes:

    return {
        state,
        allMatches,
        activeMatchIndex,
        shareUrl,
        setPattern,
        setFlags,
        setFlavor,
        setTestStrings,
        toggleFlag,
        setTestStringAt,
        addTestString,
        removeTestString,
        setActivePatternId,
        generateJsSnippet,
        goPrev,
        goNext,
    };
}
