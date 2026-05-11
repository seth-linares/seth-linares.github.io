// src/hooks/useAnimatedCats.ts
//
// React-side glue for the animated-cats simulation: state, refs, the
// imperative API (spawn / removeLast / reset), and the lifecycle effect that
// owns the rAF loop and event listeners. All per-frame work has been carved
// out into per-phase functions under `src/utils/cats/tick/*` — this file is
// now just the orchestrator.
//
// Cats live in DOCUMENT coords, not viewport: the overlay is positioned
// absolutely over the full page, cats roam the whole document, and you scroll
// past them. The cursor's doc position is computed ONCE per frame in the
// orchestrator (via toDocX/toDocY) and passed to every phase via TickContext.
//
// Reactions wired here (event listeners), implemented in tick phases:
//   cursor — flee within FLEE_RADIUS until cursor leaves SAFE_RADIUS  (cursor.ts)
//   click  — clicks within CLICK_STARTLE_RADIUS startle nearby cats;
//            shift+click spawns instead.
//   resize — re-measure obstacles + clamp every cat into new bounds
//   scroll — no reaction; cats are doc-anchored so the page just slides past them

import { useCallback, useEffect, useRef, useState } from 'react';
import { CAT_PALETTES, type CatPalette, type CatPose } from '@/types/pixel-cat';
import { setMessage } from '@/utils/cats/bubbles';
import {
    CAT_SPACING_RADIUS,
    CLICK_STARTLE_RADIUS,
    MAX_CATS,
    NAVBAR_HEIGHT,
    NAVBAR_TOP_PAD,
    OBSTACLE_SELECTOR,
    STARTLE_DURATION_MS,
} from '@/utils/cats/constants';
import { createInitialCatState, spawnRandomCat } from '@/utils/cats/factory';
import {
    PALETTE_BEHAVIORS,
    behaviorForIndex,
    paletteForIndex,
    type PaletteKey,
} from '@/utils/cats/palette';
import { getDocDims, pickNearbyClearTarget, pickNearbyTarget } from '@/utils/cats/targets';
import { detectCover } from '@/utils/cats/tick/cover';
import { updateCursorFlee, updateStartleExpiration } from '@/utils/cats/tick/cursor';
import { clampPosition, stepMovement, updateStuckCheck } from '@/utils/cats/tick/movement';
import {
    updateAnimation,
    writeBubble,
    writeCatTransform,
    writeInteractive,
} from '@/utils/cats/tick/animation';
import { publishThrottled } from '@/utils/cats/tick/publish';
import { updateSocialPick } from '@/utils/cats/tick/social';
import { updateVisit } from '@/utils/cats/tick/visit';
import type { TickContext } from '@/utils/cats/tick/types';
import {
    asDoc,
    asViewport,
    toDocX,
    toDocY,
    type AnimatedCatsState,
    type CatState,
    type DocDims,
    type ObstacleRect,
    type UseAnimatedCatsParams,
} from '@/utils/cats/types';

export function useAnimatedCats({ count, catSize }: UseAnimatedCatsParams): AnimatedCatsState {
    const catRefs = useRef<(HTMLDivElement | null)[]>([]);
    const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
    const interactiveRefs = useRef<(HTMLDivElement | null)[]>([]);
    const statesRef = useRef<CatState[]>([]);
    // Cursor is cached in VIEWPORT coords (raw clientX/clientY) — converted
    // to doc coords ONCE per frame in the tick. Storing viewport means
    // scrolling stays correct even when the cursor isn't moving.
    const mouseRef = useRef<{ vx: number; vy: number } | null>(null);
    const docDimsRef = useRef<DocDims>({ width: 0, height: 0 });
    const obstaclesRef = useRef<ObstacleRect[]>([]);
    const rafRef = useRef<number | null>(null);
    // activeCount grows past the initial `count` prop via shift+click spawns.
    // The rAF tick reads from statesRef.current.length directly, so this
    // state exists mostly to drive React re-renders.
    const [activeCount, setActiveCount] = useState(count);
    const [poses, setPoses] = useState<CatPose[]>(() => Array(count).fill('idle'));
    const [messages, setMessages] = useState<(string | null)[]>(() => Array(count).fill(null));
    const [enabled, setEnabled] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setEnabled(!mq.matches);
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    // palettes is React state (not a useMemo of activeCount) so each cat's
    // actual palette — including user-picked coats from the tray — drives
    // what gets rendered.
    const [palettes, setPalettes] = useState<CatPalette[]>(() =>
        Array.from({ length: count }, (_, i) => paletteForIndex(i))
    );
    // Names are pushed in lockstep with palettes; the simulation generates
    // them via the factory at construction time, so this state just mirrors
    // the per-cat name for consumption by hover/tooltip UI. The placeholders
    // here get replaced at first effect-init (when factory-driven cats land
    // in statesRef) — see the initial-state-once block below.
    const [names, setNames] = useState<string[]>(() => Array(count).fill(''));

    // Imperative spawn API used by both the in-effect shift+click handler AND
    // the drag-to-place tray. Pushes directly into statesRef.current (so the
    // rAF picks it up next tick) and bumps activeCount so React mounts a new
    // <div> for the cat.
    const spawn = useCallback(
        (docX: number, docY: number, paletteKey?: PaletteKey): boolean => {
            const states = statesRef.current;
            if (states.length >= MAX_CATS) return false;
            const idx = states.length;
            const palette = paletteKey ? CAT_PALETTES[paletteKey] : paletteForIndex(idx);
            const behavior = paletteKey ? PALETTE_BEHAVIORS[paletteKey] : behaviorForIndex(idx);
            // The spawn API takes plain numbers (DocPos is a TS-only brand);
            // tag them at this boundary so internal types check.
            const x = asDoc(docX);
            const y = asDoc(docY);
            const target = pickNearbyClearTarget(
                catSize,
                x,
                y,
                docDimsRef.current,
                obstaclesRef.current,
                { states, selfIdx: idx, spacing: CAT_SPACING_RADIUS }
            );
            const newCat = createInitialCatState({
                x,
                y,
                targetX: target.x,
                targetY: target.y,
                behavior,
                palette,
            });
            states.push(newCat);
            // Greet on spawn — both shift+click and the drag tray route here.
            setMessage(newCat, 'spawned');
            setActiveCount(states.length);
            setPalettes((prev) => [...prev, palette]);
            setMessages((prev) => [...prev, newCat.message]);
            setNames((prev) => [...prev, newCat.name]);
            return true;
        },
        [catSize]
    );

    const removeLast = useCallback((): boolean => {
        const states = statesRef.current;
        if (states.length === 0) return false;
        states.pop();
        setActiveCount(states.length);
        setPalettes((prev) => prev.slice(0, -1));
        setMessages((prev) => prev.slice(0, -1));
        setNames((prev) => prev.slice(0, -1));
        return true;
    }, []);

    const reset = useCallback(() => {
        const fresh = Array.from({ length: count }, (_, i) =>
            spawnRandomCat(i, docDimsRef.current, catSize)
        );
        statesRef.current = fresh;
        setActiveCount(count);
        setPalettes(Array.from({ length: count }, (_, i) => paletteForIndex(i)));
        setMessages(Array(count).fill(null));
        setNames(fresh.map((c) => c.name));
    }, [count, catSize]);

    useEffect(() => {
        if (typeof window === 'undefined' || !enabled) return;

        docDimsRef.current = getDocDims();

        // Measure the doc-coord rects of every `[data-cat-obstacle]` element.
        // Stored in doc coords (rect + scrollX/Y at measure time) so the
        // cache stays valid across scroll without per-frame remeasurement.
        const measureObstacles = () => {
            const els = document.querySelectorAll<HTMLElement>(OBSTACLE_SELECTOR);
            const sx = window.scrollX;
            const sy = window.scrollY;
            const rects: ObstacleRect[] = [];
            els.forEach((el) => {
                const r = el.getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0) return;
                rects.push({
                    x: asDoc(r.left + sx),
                    y: asDoc(r.top + sy),
                    w: r.width,
                    h: r.height,
                });
            });
            obstaclesRef.current = rects;
        };
        measureObstacles();

        if (statesRef.current.length === 0) {
            statesRef.current = Array.from({ length: count }, (_, i) =>
                spawnRandomCat(i, docDimsRef.current, catSize)
            );
            // Names get assigned by the factory at construction time; surface
            // them into React state now so consumers see the real names from
            // the first render rather than the empty placeholders.
            setNames(statesRef.current.map((c) => c.name));
        }

        // Throttle remeasures to one per frame; ResizeObserver can fire
        // repeatedly during the typewriter effect.
        let measurePending = false;
        const queueMeasure = () => {
            if (measurePending) return;
            measurePending = true;
            requestAnimationFrame(() => {
                measurePending = false;
                measureObstacles();
            });
        };

        const resizeObs = new ResizeObserver(queueMeasure);
        resizeObs.observe(document.documentElement);

        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current = { vx: e.clientX, vy: e.clientY };
        };
        const onMouseLeave = () => {
            mouseRef.current = null;
        };
        const onClick = (e: MouseEvent) => {
            // toDocX/toDocY are the documented seam between viewport and doc
            // coords — they add scrollX/Y at the point of conversion.
            const cx = toDocX(asViewport(e.clientX));
            const cy = toDocY(asViewport(e.clientY));

            // Shift+click = power-user shortcut for the same spawn path that
            // the floating button drives. Skips the startle below.
            if (e.shiftKey) {
                spawn(cx, cy);
                return;
            }

            const states = statesRef.current;
            const now = performance.now();
            for (const cat of states) {
                if (cat.run.kind === 'startled' || cat.run.kind === 'fleeing') continue;
                const d = Math.hypot(cat.x - cx, cat.y - cy);
                if (d < CLICK_STARTLE_RADIUS) {
                    const norm = Math.max(d, 1);
                    cat.run = {
                        kind: 'startled',
                        startleUntil: now + STARTLE_DURATION_MS,
                        targetX: asDoc(cat.x + ((cat.x - cx) / norm) * 220),
                        targetY: asDoc(cat.y + ((cat.y - cy) / norm) * 220),
                    };
                    cat.facingLeft = cat.x < cx;
                    cat.distSinceFrame = 0;
                    setMessage(cat, 'startle', 1500);
                }
            }
        };
        const onResize = () => {
            // Re-measure the doc, then clamp every cat into the new bounds
            // and nudge idle cats toward a fresh target so they don't sit
            // visibly off-doc.
            docDimsRef.current = getDocDims();
            measureObstacles();
            const dims = docDimsRef.current;
            const inset = catSize / 2;
            const topClamp = NAVBAR_HEIGHT + inset + NAVBAR_TOP_PAD;
            for (const cat of statesRef.current) {
                cat.x = asDoc(Math.max(inset, Math.min(dims.width - inset, cat.x)));
                cat.y = asDoc(Math.max(topClamp, Math.min(dims.height - inset, cat.y)));
                if (cat.run.kind === 'idle' || cat.run.kind === 'walking') {
                    const t = pickNearbyTarget(catSize, cat.x, cat.y, dims);
                    cat.run = { kind: 'walking', targetX: t.x, targetY: t.y };
                }
            }
        };
        window.addEventListener('mousemove', onMouseMove);
        document.documentElement.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('click', onClick);
        window.addEventListener('resize', onResize);

        let lastPosesPushed = 0;

        const tick = () => {
            const now = performance.now();
            const states = statesRef.current;
            const dims = docDimsRef.current;
            const obstacles = obstaclesRef.current;
            // Convert cursor to DOCUMENT coords ONCE per frame. mouseRef
            // stores raw clientX/clientY so we route through toDocX/toDocY
            // here; scroll may have changed since the last mousemove, so
            // this is recomputed every frame even if the cursor hasn't
            // moved.
            const mouseDoc = mouseRef.current
                ? {
                      x: toDocX(asViewport(mouseRef.current.vx)),
                      y: toDocY(asViewport(mouseRef.current.vy)),
                  }
                : null;

            for (let i = 0; i < states.length; i++) {
                const cat = states[i];
                const el = catRefs.current[i];
                if (!el) continue;

                const ctx: TickContext = {
                    now,
                    dims,
                    obstacles,
                    states,
                    i,
                    catSize,
                    mouseDoc,
                };

                updateStartleExpiration(cat, ctx);
                updateCursorFlee(cat, ctx);
                updateSocialPick(cat, ctx);
                updateVisit(cat, ctx);
                const inCover = detectCover(cat, ctx);
                const stepDist = stepMovement(cat, ctx, inCover);
                clampPosition(cat, ctx);
                updateStuckCheck(cat, ctx, stepDist);
                updateAnimation(cat, stepDist);
                writeCatTransform(el, cat, ctx);
                writeBubble(cat, bubbleRefs.current[i], ctx);
                writeInteractive(cat, interactiveRefs.current[i], ctx);
            }

            lastPosesPushed = publishThrottled(now, states, setPoses, setMessages, lastPosesPushed);

            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('mousemove', onMouseMove);
            document.documentElement.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('click', onClick);
            window.removeEventListener('resize', onResize);
            resizeObs.disconnect();
        };
    }, [count, catSize, enabled, spawn]);

    return {
        poses,
        palettes,
        messages,
        names,
        catRefs,
        bubbleRefs,
        interactiveRefs,
        enabled,
        count: activeCount,
        maxCount: MAX_CATS,
        spawn,
        removeLast,
        reset,
        isAtInitialCount: activeCount === count,
    };
}
