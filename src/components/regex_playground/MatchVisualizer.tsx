// src/components/regex_playground/MatchVisualizer.tsx

import { MatchVisualizerProps } from '@/types/regex';
import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';

function MatchVisualizer({
    testStrings,
    matches,
    error,
    activeGlobalIndex,
    onScrollToActive = true,
}: MatchVisualizerProps) {
    const activeRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        if (!onScrollToActive) return;
        if (typeof activeGlobalIndex !== 'number') return;
        if (activeRef.current) {
            activeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
            });
        }
    }, [activeGlobalIndex, onScrollToActive]);

    const blockOffsets = useMemo(() => {
        const offsets: number[] = [];
        let base = 0;
        for (let i = 0; i < matches.length; i++) {
            offsets[i] = base;
            base += matches[i].matches.length;
        }
        return offsets;
    }, [matches]);

    return (
        <div className="card bg-linear-to-br from-base-200 to-base-300 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <h2 className="card-title text-primary">Matches</h2>
                    {error ? <div className="badge badge-error">{error}</div> : null}
                </div>
                {!matches.length && !error ? (
                    <div className="text-sm opacity-70">No matches yet.</div>
                ) : null}
                <div className="grid gap-4">
                    {matches.map((res) => {
                        const src = testStrings[res.testStringIndex] ?? '';
                        const parts: React.ReactNode[] = [];
                        let cursor = 0;
                        res.matches.forEach((m, idx) => {
                            const globalIdx = (blockOffsets?.[res.testStringIndex] ?? 0) + idx;
                            const isActive =
                                typeof activeGlobalIndex === 'number' &&
                                globalIdx === activeGlobalIndex;
                            if (m.start > cursor) {
                                parts.push(
                                    <span key={`t-${idx}-${cursor}`} className="opacity-80">
                                        {src.slice(cursor, m.start)}
                                    </span>
                                );
                            }
                            parts.push(
                                <motion.span
                                    key={`m-${res.testStringIndex}-${idx}-${m.start}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    ref={isActive ? activeRef : null}
                                    className={
                                        'px-1 rounded transition-colors duration-300 ' +
                                        (isActive
                                            ? 'bg-secondary text-success-content ring-2 ring-success-content/70 ring-offset-2 ring-offset-base-200'
                                            : 'bg-success text-success-content')
                                    }
                                >
                                    {src.slice(m.start, m.end)}
                                </motion.span>
                            );
                            cursor = m.end;
                        });
                        if (cursor < src.length) {
                            parts.push(
                                <span key={`end-${cursor}`} className="opacity-80">
                                    {src.slice(cursor)}
                                </span>
                            );
                        }
                        return (
                            <div
                                key={res.testStringIndex}
                                className="p-3 rounded border border-base-300"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs opacity-70">
                                        Test #{res.testStringIndex + 1}
                                        {res.truncated ? ' (truncated)' : ''}
                                    </div>
                                    <div
                                        className="badge badge-ghost badge-sm"
                                        aria-label={`Matches for test ${res.testStringIndex + 1}`}
                                    >
                                        {res.totalMatches} matches
                                    </div>
                                </div>
                                <pre className="whitespace-pre-wrap wrap-break-word font-mono text-sm">
                                    {parts}
                                </pre>

                                <div className="mt-2 space-y-1">
                                    {res.matches.map((m, idx) => (
                                        <div
                                            key={`details-${idx}-${m.start}`}
                                            className="text-xs bg-base-100/60 rounded p-2 border border-base-300"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="badge badge-ghost badge-xs">
                                                    Match {idx + 1}
                                                </span>
                                                <span className="opacity-70">indices:</span>
                                                <code className="font-mono">{m.start}</code>
                                                <span>-</span>
                                                <code className="font-mono">{m.end}</code>
                                                <span className="opacity-70">len:</span>
                                                <code className="font-mono">{m.end - m.start}</code>
                                            </div>
                                            {m.groups && m.groups.length > 0 && (
                                                <div className="ml-4 mt-1 text-xs">
                                                    {m.groups.map((g, gIdx) => (
                                                        <div key={gIdx} className="flex gap-2">
                                                            <span className="opacity-60">
                                                                Group {gIdx + 1}
                                                                {g.name ? ` (${g.name})` : ''}:
                                                            </span>
                                                            <span className="font-mono break-all">
                                                                {g.value}
                                                            </span>
                                                            {(g.start ?? -1) >= 0 &&
                                                                (g.end ?? -1) >= 0 && (
                                                                    <span className="opacity-60">
                                                                        [{g.start}-{g.end}]
                                                                    </span>
                                                                )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default React.memo(MatchVisualizer);
