// src/components/TerminalHero.tsx
//
// Two-phase terminal: scripted autoplay → live shell. All logic in useTerminalHero.

import useTerminalHero from '@/hooks/useTerminalHero';

function TerminalHero() {
    const {
        rendered,
        typingText,
        inputValue,
        cursorPos,
        onInputChange,
        phase,
        onSkip,
        onKeyDown,
        inputRef,
        focusInput,
    } = useTerminalHero();

    const handleClick = () => {
        if (phase === 'autoplay') onSkip();
        else focusInput();
    };

    return (
        <div
            onClick={handleClick}
            className="bg-neutral text-neutral-content rounded-xl shadow-2xl overflow-hidden font-mono text-sm cursor-text select-text relative"
            role="region"
            aria-label="Interactive terminal"
        >
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-content/10 border-b border-neutral-content/10">
                <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-error/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
                </div>
                <span className="text-xs opacity-60 ml-2">seth@portfolio:~</span>
                <span className="ml-auto text-xs opacity-50 italic">
                    {phase === 'autoplay' ? 'click to skip' : 'type — enter to run'}
                </span>
            </div>
            <div className="p-4 space-y-1 leading-relaxed min-h-96">
                {rendered.map((step, i) => {
                    if (step.kind === 'blank') return <div key={i} className="h-3" />;
                    if (step.kind === 'cmd')
                        return (
                            <div key={i} className="flex gap-2 flex-wrap">
                                <span className="text-success">seth@portfolio</span>
                                <span className="opacity-60">$</span>
                                <span className="break-all">{step.text}</span>
                            </div>
                        );
                    return (
                        <div
                            key={i}
                            className={`whitespace-pre-wrap wrap-break-word ${step.cls ?? ''}`}
                        >
                            {step.text}
                        </div>
                    );
                })}

                {phase === 'autoplay' && typingText && (
                    <div className="flex gap-2">
                        <span className="text-success">seth@portfolio</span>
                        <span className="opacity-60">$</span>
                        <span>
                            {typingText}
                            <span className="inline-block w-2 h-4 ml-0.5 bg-neutral-content/80 align-middle animate-pulse" />
                        </span>
                    </div>
                )}

                {phase === 'interactive' && (
                    <div className="flex gap-2 flex-wrap">
                        <span className="text-success shrink-0">seth@portfolio</span>
                        <span className="opacity-60 shrink-0">$</span>
                        <span className="whitespace-pre-wrap break-all">
                            {inputValue.slice(0, cursorPos)}
                            {cursorPos < inputValue.length ? (
                                <span className="bg-neutral-content text-neutral animate-pulse">
                                    {inputValue[cursorPos] === ' ' ? ' ' : inputValue[cursorPos]}
                                </span>
                            ) : (
                                <span className="inline-block w-2 h-4 bg-neutral-content/80 align-middle animate-pulse" />
                            )}
                            {inputValue.slice(cursorPos + 1)}
                        </span>
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                disabled={phase !== 'interactive'}
                className="absolute opacity-0 pointer-events-none w-px h-px"
                aria-label="Terminal input"
                tabIndex={phase === 'interactive' ? 0 : -1}
            />
        </div>
    );
}

export default TerminalHero;
