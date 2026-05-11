// src/components/AnimatedCats.tsx
//
// Wandering pixel cats overlay. All simulation logic lives in useAnimatedCats; this
// component owns the cat <div>s, the speech-bubble overlay, and the drag-to-place
// tray in the bottom-right.
//
// Mount this inside a positioned wrapper that has `isolate` (creates a stacking
// context). Two sibling overlays:
//   - cats overlay at `-z-10`: cats sit behind page content (so they walk under
//     [data-cat-obstacle] blocks).
//   - bubbles overlay at `z-10`: speech bubbles sit ABOVE page content, so a
//     hidden cat still announces what it's up to. Tomodachi-style.
// Cats are doc-anchored, so the wrapper must span the full page height (e.g.
// min-h-screen on a homepage root).
//
// Spawn UX: a tray of four cat sprites lives at the bottom-right of the viewport.
// Each sprite is draggable — press, drag onto the page, release. A semi-transparent
// "ghost cat" follows the pointer during the drag so it's obvious what's being
// placed. Release over the tray (or press Esc) cancels. PointerEvents are used so
// the same gesture works for mouse and touch. Shift+click anywhere still routes
// through the same spawn path as a power-user shortcut. Capped at MAX_CATS. Each
// tray sprite's `title` attr names the personality so curious users can discover
// why each coat behaves the way it does.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimatedCats } from '@/hooks/useAnimatedCats';
import { CAT_PALETTES } from '@/types/pixel-cat';
import PixelCat from './PixelCat';

interface Props {
    count?: number;
    catSize?: number;
    opacity?: number;
}

const TRAY_ATTR = 'data-cat-tray';
// The tray shows one draggable sprite per coat color — same keys the hook uses
// internally to seed PALETTE_BEHAVIORS, so picking a coat also picks personality.
const SPAWN_PALETTES = ['orange', 'black', 'gray', 'siamese'] as const;

// Personality hint surfaced via tooltip on each tray sprite. Coat → behavior
// mapping mirrors PALETTE_BEHAVIORS inside the hook — keep these in sync.
const PERSONALITY_LABEL: Record<string, string> = {
    orange: 'orange · chill',
    black: 'black · playful',
    gray: 'gray · chill',
    siamese: 'siamese · shy',
};

// Tiny speech-bubble used by the per-cat overlay. Pure presentation. The
// bubble's parent <div> handles translation via the rAF loop; this inner
// element centers itself horizontally over that anchor with -translate-x-1/2.
function CatBubble({ text }: { text: string | null }) {
    if (!text) return null;
    return (
        <div
            className="relative -translate-x-1/2 inline-block text-base font-pixel leading-none tracking-wide text-base-content/95 bg-base-100/95 backdrop-blur-sm border border-base-300 rounded-md px-2 py-0.5 shadow-md whitespace-nowrap after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-[5px] after:w-2 after:h-2 after:bg-base-100/95 after:border-r after:border-b after:border-base-300 after:rotate-45"
        >
            {text}
        </div>
    );
}

function AnimatedCats({ count = 8, catSize = 56, opacity = 0.85 }: Props) {
    const {
        poses,
        palettes,
        messages,
        catRefs,
        bubbleRefs,
        enabled,
        count: activeCount,
        maxCount,
        spawn,
        removeLast,
        reset,
        isAtInitialCount,
    } = useAnimatedCats({ count, catSize });

    // Drag state has TWO halves on purpose:
    //   - dragKey: React state. Drives whether the ghost <div> is rendered and
    //     which palette PixelCat uses inside it. Set on pointerdown, cleared on
    //     drop / cancel — exactly twice per drag, not on every pointermove.
    //   - ghostRef + dragInfoRef: refs. The pointermove handler writes the ghost's
    //     transform directly to the DOM (no setState, no React reconcile) and
    //     pointerup reads paletteKey from the ref. That's the same pattern the
    //     rAF loop uses for cat positions, and it's why dragging stays smooth
    //     even with a bunch of PixelCat SVG sprites elsewhere on the page.
    const [dragKey, setDragKey] = useState<string | null>(null);
    const ghostRef = useRef<HTMLDivElement | null>(null);
    const dragInfoRef = useRef<{ paletteKey: string; startX: number; startY: number } | null>(
        null
    );

    const positionGhost = useCallback(
        (clientX: number, clientY: number) => {
            const el = ghostRef.current;
            if (!el) return;
            el.style.transform = `translate(${clientX - catSize / 2}px, ${clientY - catSize / 2}px)`;
        },
        [catSize]
    );

    // Whenever a drag starts, place the ghost at the initial pointer location
    // before the first pointermove fires. The effect runs synchronously after the
    // ghost is mounted, so there's no one-frame flash at (0, 0).
    useEffect(() => {
        if (!dragKey || !dragInfoRef.current) return;
        positionGhost(dragInfoRef.current.startX, dragInfoRef.current.startY);
    }, [dragKey, positionGhost]);

    useEffect(() => {
        if (!dragKey) return;
        const onMove = (e: PointerEvent) => {
            positionGhost(e.clientX, e.clientY);
        };
        const onUp = (e: PointerEvent) => {
            const target = e.target as HTMLElement | null;
            const releasedOnTray = !!target?.closest(`[${TRAY_ATTR}]`);
            const info = dragInfoRef.current;
            if (info && !releasedOnTray) {
                spawn(
                    e.clientX + window.scrollX,
                    e.clientY + window.scrollY,
                    info.paletteKey
                );
            }
            dragInfoRef.current = null;
            setDragKey(null);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                dragInfoRef.current = null;
                setDragKey(null);
            }
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            window.removeEventListener('keydown', onKey);
        };
        // dragKey is in the deps so listeners attach on drag start and detach on
        // drag end exactly once — pointermove never causes this effect to re-run.
    }, [dragKey, spawn, positionGhost]);

    if (!enabled) return null;

    const atCap = activeCount >= maxCount;
    const ghostSize = catSize;

    return (
        <>
            <div className="absolute inset-0 pointer-events-none -z-10" aria-hidden="true">
                {Array.from({ length: activeCount }).map((_, i) => (
                    <div
                        key={i}
                        ref={(el) => {
                            catRefs.current[i] = el;
                        }}
                        className="absolute top-0 left-0 will-change-transform"
                        style={{ opacity }}
                    >
                        <PixelCat
                            pose={poses[i] ?? 'idle'}
                            palette={palettes[i] ?? CAT_PALETTES.orange}
                            size={catSize}
                        />
                    </div>
                ))}
            </div>

            {/* Speech-bubble overlay. Sibling of the cats overlay but at z-10 so
                bubbles render ABOVE [data-cat-obstacle] blocks — a cat hidden
                under the typewriter terminal still gets to "talk". The rAF loop
                writes a translate-only transform to each entry per frame; the
                inner CatBubble handles horizontal centering and fades via
                CSS opacity. aria-hidden because bubbles are decorative flavor;
                the tray's role=status row remains the AT announcement surface. */}
            <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
                {Array.from({ length: activeCount }).map((_, i) => (
                    <div
                        key={i}
                        ref={(el) => {
                            bubbleRefs.current[i] = el;
                        }}
                        className="absolute top-0 left-0 will-change-transform transition-opacity duration-200"
                        style={{ opacity: messages[i] ? 1 : 0 }}
                    >
                        <CatBubble text={messages[i] ?? null} />
                    </div>
                ))}
            </div>

            {dragKey && (
                <div
                    ref={ghostRef}
                    className="fixed top-0 left-0 pointer-events-none z-40 will-change-transform"
                    style={{
                        opacity: 0.75,
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))',
                    }}
                    aria-hidden="true"
                >
                    <PixelCat
                        pose="sit"
                        palette={CAT_PALETTES[dragKey] ?? CAT_PALETTES.orange}
                        size={ghostSize}
                    />
                </div>
            )}

            <div
                {...{ [TRAY_ATTR]: '' }}
                className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-1.5 select-none"
            >
                <div
                    className={`flex items-center gap-1 bg-base-100/90 backdrop-blur-sm border border-base-300 rounded-2xl p-1.5 shadow-lg ${
                        atCap ? 'opacity-50' : ''
                    }`}
                >
                    {SPAWN_PALETTES.map((key) => (
                        <button
                            key={key}
                            type="button"
                            disabled={atCap}
                            onPointerDown={(e) => {
                                if (atCap) return;
                                // Prevent text-selection + scroll-on-touch so the
                                // gesture stays a clean drag.
                                e.preventDefault();
                                (e.currentTarget as HTMLElement).releasePointerCapture?.(
                                    e.pointerId
                                );
                                dragInfoRef.current = {
                                    paletteKey: key,
                                    startX: e.clientX,
                                    startY: e.clientY,
                                };
                                setDragKey(key);
                            }}
                            style={{ touchAction: 'none' }}
                            aria-label={`Drag onto the page to spawn a ${PERSONALITY_LABEL[key] ?? key} cat`}
                            title={
                                atCap
                                    ? `Cat limit reached (${activeCount}/${maxCount})`
                                    : `${PERSONALITY_LABEL[key] ?? key} · drag to spawn`
                            }
                            className={`p-1 rounded-lg transition-all ${
                                atCap
                                    ? 'cursor-not-allowed'
                                    : dragKey === key
                                      ? 'bg-primary/15 ring-2 ring-primary/30 cursor-grabbing'
                                      : 'hover:bg-base-200 hover:scale-110 cursor-grab active:cursor-grabbing'
                            }`}
                        >
                            <PixelCat
                                pose="sit"
                                palette={CAT_PALETTES[key]}
                                size={32}
                            />
                        </button>
                    ))}
                    {/* Action divider + remove/reset controls */}
                    <div
                        className="w-px self-stretch bg-base-300 mx-0.5"
                        aria-hidden="true"
                    />
                    <button
                        type="button"
                        onClick={removeLast}
                        disabled={activeCount === 0}
                        aria-label="Remove the last cat"
                        title={
                            activeCount === 0
                                ? 'No cats to remove'
                                : 'Remove the last cat'
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-base-content/70 hover:bg-base-200 hover:text-base-content active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent text-xl font-bold leading-none"
                    >
                        −
                    </button>
                    <button
                        type="button"
                        onClick={reset}
                        disabled={isAtInitialCount && !dragKey}
                        aria-label="Reset to the default cats"
                        title={
                            isAtInitialCount
                                ? 'Already at default'
                                : 'Reset to default cats'
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-base-content/70 hover:bg-base-200 hover:text-base-content active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent text-base leading-none"
                    >
                        <span aria-hidden="true">↺</span>
                    </button>
                </div>
                <span
                    role="status"
                    aria-live="polite"
                    className="text-sm font-mono font-medium text-base-content/90 bg-base-100/85 backdrop-blur-sm border border-base-300 rounded-xl px-3 py-1 shadow-md"
                >
                    {atCap
                        ? `cat limit · ${activeCount}/${maxCount}`
                        : dragKey
                          ? 'release on the page to place · esc to cancel'
                          : `drag · −  ↺  · ${activeCount}/${maxCount}`}
                </span>
            </div>
        </>
    );
}

export default AnimatedCats;
