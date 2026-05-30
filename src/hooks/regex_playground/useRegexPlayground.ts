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

type InitialPlaygroundState = {
    pattern: string;
    flags: RegexFlags;
    flavor: RegexFlavor;
    testStrings: string[];
};

function computeInitialState(): InitialPlaygroundState {
    const urlState = parseInitialState();
    const hasUrlParams =
        urlState.pattern ||
        (urlState.testStrings && urlState.testStrings.length > 1) ||
        (urlState.flags && hasNonDefaultFlags(urlState.flags));

    if (hasUrlParams) {
        return {
            pattern: urlState.pattern ?? '',
            flags: urlState.flags ?? defaultFlags,
            flavor: 'javascript',
            testStrings: urlState.testStrings ?? [''],
        };
    }

    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('regex_playground_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    pattern: typeof parsed.pattern === 'string' ? parsed.pattern : '',
                    flags: parsed.flags ?? defaultFlags,
                    flavor:
                        typeof parsed.flavor === 'string'
                            ? (parsed.flavor as RegexFlavor)
                            : 'javascript',
                    testStrings: Array.isArray(parsed.testStrings) ? parsed.testStrings : [''],
                };
            }
        } catch (error) {
            console.warn('Failed to load regex playground state from localStorage:', error);
        }
    }

    return {
        pattern: '',
        flags: defaultFlags,
        flavor: 'javascript',
        testStrings: [''],
    };
}

export function useRegexPlayground() {
    const [initial] = useState(computeInitialState);
    const [pattern, setPattern] = useState(initial.pattern);
    const [flags, setFlags] = useState<RegexFlags>(initial.flags);
    const [flavor, setFlavor] = useState<RegexFlavor>(initial.flavor);
    const [testStrings, setTestStrings] = useState<string[]>(initial.testStrings);
    const [activePatternId, setActivePatternId] = useState<string | null>(null);
    const [activeMatchIndexRaw, setActiveMatchIndex] = useState<number>(-1);

    const debouncedPattern = useDebouncedValue(pattern, 300);
    const debouncedFlags = useDebouncedValue(flags, 300);
    const debouncedTests = useDebouncedValue(testStrings, 300);

    const { matches, error } = useRegexMatcher(debouncedPattern, debouncedFlags, debouncedTests);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedPattern) params.set('pattern', debouncedPattern);
        const f = flagsToString(debouncedFlags);
        if (f) params.set('flags', f);
        debouncedTests.forEach((t) => params.append('test', t));

        updateHashParams(params);
    }, [debouncedPattern, debouncedFlags, debouncedTests]);

    useEffect(() => {
        const handleHashChange = () => {
            const newState = parseInitialState();
            if (newState.pattern !== undefined) setPattern(newState.pattern);
            if (newState.flags) setFlags(newState.flags);
            if (newState.testStrings) setTestStrings(newState.testStrings);
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(
                'regex_playground_state',
                JSON.stringify({ pattern, flags, flavor, testStrings })
            );
        } catch (error) {
            console.warn('Failed to save regex playground state to localStorage:', error);
        }
    }, [pattern, flags, flavor, testStrings]);

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

    const explanation = useMemo<PatternExplanation | null>(() => {
        if (!debouncedPattern) return null;
        return {
            ast: [
                {
                    type: 'pattern',
                    value: debouncedPattern,
                    start: 0,
                    end: debouncedPattern.length,
                },
            ],
            summary: 'Basic pattern preview. Detailed explanation coming in Phase 2.',
        };
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

    const activeMatchIndex = !allMatches.length
        ? -1
        : activeMatchIndexRaw >= allMatches.length
          ? 0
          : activeMatchIndexRaw;

    const goPrev = useCallback(() => {
        if (!allMatches.length) return;
        setActiveMatchIndex(
            activeMatchIndex === -1
                ? allMatches.length - 1
                : (activeMatchIndex - 1 + allMatches.length) % allMatches.length
        );
    }, [allMatches.length, activeMatchIndex]);

    const goNext = useCallback(() => {
        if (!allMatches.length) return;
        setActiveMatchIndex(
            activeMatchIndex === -1 ? 0 : (activeMatchIndex + 1) % allMatches.length
        );
    }, [allMatches.length, activeMatchIndex]);

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
