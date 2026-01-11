// src/components/regex_playground/RegexPlayground.tsx
import { useMemo, useCallback } from 'react';
import { useRegexPlayground } from '@/hooks/regex_playground/useRegexPlayground';
import PatternInput from '@/components/regex_playground/PatternInput';
import TestStringInput from '@/components/regex_playground/TestStringInput';
import MatchVisualizer from '@/components/regex_playground/MatchVisualizer';
import PatternLibrary from '@/components/regex_playground/PatternLibrary';
import CodeSection from '@/components/regex_playground/CodeSection';
import MatchesNav from '@/components/regex_playground/MatchesNav';
import PatternExplainer from '@/components/regex_playground/PatternExplainer';
import ShareButton from '@/components/regex_playground/ShareButton';
import WarningToast from '@/components/regex_playground/WarningToast';
import { usePatternExplainer } from '@/hooks/regex_playground/usePatternExplainer';
import { useKeyboardShortcuts } from '@/hooks/regex_playground/useKeyboardShortcuts';
import { useWarningNotification } from '@/hooks/regex_playground/useWarningNotification';

function RegexPlayground() {
    const {
        state,
        allMatches,
        activeMatchIndex,
        shareUrl,
        setPattern,
        toggleFlag,
        setTestStringAt,
        addTestString,
        removeTestString,
        generateJsSnippet,
        setFlags,
        setActivePatternId,
        goPrev,
        goNext,
    } = useRegexPlayground();
    const { tokens, warnings } = usePatternExplainer(state.pattern);
    const { showToast, toastWarnings, dismissToast } = useWarningNotification(warnings);

    // Memoize the generated snippet to avoid recalculation
    const jsSnippet = useMemo(() => generateJsSnippet(), [generateJsSnippet]);

    // Memoize the copy handler
    const handleCopySnippet = useCallback(() => {
        navigator.clipboard.writeText(jsSnippet);
    }, [jsSnippet]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onFocusPattern: () => {
            const patternInput = document.querySelector(
                'input[placeholder*="pattern"]'
            ) as HTMLInputElement;
            patternInput?.focus();
        },
        onReset: () => {
            setPattern('');
            setFlags({ g: true, i: false, m: false, s: false, u: false, y: false });
        },
        onPrevMatch: goPrev,
        onNextMatch: goNext,
    });

    return (
        <div className="px-4 pb-10 pt-24">
            {' '}
            {/* top padding to clear Navbar height */}
            <div className="max-w-7xl mx-auto">
                {/* Header / Toolbar */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            <span className="bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                                Regex Playground
                            </span>
                        </h1>
                        <div className="flex items-center gap-2">
                            <ShareButton
                                shareUrl={shareUrl}
                                onShare={() => {
                                    // Optional: track analytics or show notification
                                    console.log('Regex pattern shared:', state.pattern);
                                }}
                            />
                            <div className="tooltip tooltip-top z-60" data-tip="Reset inputs">
                                <button
                                    className="btn btn-ghost btn-sm hover:shadow-md transition-all"
                                    onClick={() => {
                                        setPattern('');
                                        // reset flags to defaults
                                        setFlags({
                                            g: true,
                                            i: false,
                                            m: false,
                                            s: false,
                                            u: false,
                                            y: false,
                                        });
                                    }}
                                    aria-label="Reset pattern, flags, and tests"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-base-content/70 mt-2">
                        Test, learn, and debug regular expressions with real-time highlighting and a
                        handy pattern library.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Left column: Editors and Results */}
                    <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-6">
                        {/* Pattern Editor */}
                        <div className="sticky top-20 z-10">
                            <PatternInput
                                pattern={state.pattern}
                                setPattern={setPattern}
                                flags={state.flags}
                                toggleFlag={toggleFlag}
                                warnings={warnings}
                            />
                            {state.error && (
                                <div className="alert alert-error mt-3">
                                    <span>{state.error}</span>
                                </div>
                            )}
                        </div>

                        {/* Test Strings (extracted reusable component usage) */}
                        <TestStringInput
                            testStrings={state.testStrings}
                            setTestStringAt={setTestStringAt}
                            addTestString={addTestString}
                            removeTestString={removeTestString}
                        />

                        {/* Matches */}
                        <MatchVisualizer
                            testStrings={state.testStrings}
                            matches={state.matches}
                            error={state.error}
                            activeGlobalIndex={allMatches.length ? activeMatchIndex : undefined}
                            onScrollToActive={true}
                        />
                        <MatchesNav
                            totalMatches={allMatches.length}
                            currentIndex={allMatches.length ? activeMatchIndex + 1 : 0}
                            disabled={!allMatches.length}
                            onPrev={goPrev}
                            onNext={goNext}
                            error={state.error}
                        />
                        {/* Pattern Explanation */}
                        {state.pattern && tokens.length > 0 && (
                            <PatternExplainer pattern={state.pattern} tokens={tokens} />
                        )}

                        {/* Code */}
                        <CodeSection
                            title="Code Generation"
                            code={jsSnippet}
                            onCopy={handleCopySnippet}
                            pattern={state.pattern}
                            flags={state.flags}
                        />
                    </div>

                    {/* Right column: Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="lg:sticky lg:top-24 flex flex-col gap-6">
                            {/* Pattern Library */}
                            <PatternLibrary
                                onUsePattern={({ pattern, flags, testString }) => {
                                    setPattern(pattern);
                                    if (flags) {
                                        setFlags((prev) => ({ ...prev, ...flags }));
                                    }
                                    // Set the test string if provided by the pattern library
                                    if (testString) {
                                        setTestStringAt(0, testString);
                                    }
                                    setActivePatternId(pattern);
                                }}
                                activePatternId={state.activePatternId || undefined}
                            />

                            {/* Quick Actions */}
                            <div className="card bg-base-200 shadow-xl">
                                <div className="card-body">
                                    <h3 className="card-title text-sm text-primary">
                                        Keyboard Shortcuts
                                    </h3>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span>Focus Pattern</span>
                                            <kbd className="kbd kbd-xs">Ctrl+/</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Navigate Matches</span>
                                            <div className="flex gap-1">
                                                <kbd className="kbd kbd-xs">Ctrl+←</kbd>
                                                <kbd className="kbd kbd-xs">Ctrl+→</kbd>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Reset</span>
                                            <kbd className="kbd kbd-xs">Ctrl+Shift+R</kbd>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Warning toast notification */}
            <WarningToast warnings={toastWarnings} visible={showToast} onDismiss={dismissToast} />
        </div>
    );
}

export default RegexPlayground;
