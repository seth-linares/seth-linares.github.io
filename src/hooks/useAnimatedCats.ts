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
// orchestrator and passed via TickContext to every phase that needs it.
//
// Reactions wired here (event listeners), implemented in tick phases:
//   cursor — flee within FLEE_RADIUS until cursor leaves SAFE_RADIUS  (cursor.ts)
//   click  — clicks within CLICK_STARTLE_RADIUS startle nearby cats;
//            shift+click spawns instead. (event listener below; phase: startle
//            expiration in cursor.ts)
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
} from '@/utils/cats/palette';
import { getDocDims, pickNearbyClearTarget, pickNearbyTarget } from '@/utils/cats/targets';
import { detectCover } from '@/utils/cats/tick/cover';
import { updateCursorFlee, updateStartleExpiration } from '@/utils/cats/tick/cursor';
import {
    clampPosition,
    stepMovement,
    updateStuckCheck,
} from '@/utils/cats/tick/movement';
import { updateAnimation, writeBubble, writeCatTransform } from '@/utils/cats/tick/animation';
import { publishThrottled } from '@/utils/cats/tick/publish';
import { updateSocialPick } from '@/utils/cats/tick/social';
import { updateVisit } from '@/utils/cats/tick/visit';
import type { TickContext } from '@/utils/cats/tick/types';
import type {
    AnimatedCatsState,
    CatState,
    DocDims,
    ObstacleRect,
    UseAnimatedCatsParams,
} from '@/utils/cats/types';

export function useAnimatedCats({ count, catSize }: UseAnimatedCatsParams): AnimatedCatsState {
    const catRefs = useRef<(HTMLDivElement | null)[]>([]);
    const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
    const statesRef = useRef<CatState[]>([]);
    const mouseRef = useRef<{ vx: number; vy: number } | null>(null);
    const docDimsRef = useRef<DocDims>({ width: 0, height: 0 });
    const obstaclesRef = useRef<ObstacleRect[]>([]);
    const rafRef = useRef<number | null>(null);
    // activeCount grows past the initial `count` prop via shift+click spawns. The
    // rAF tick reads from statesRef.current.length directly, so this state exists
    // mostly to drive React re-renders (so new <div> elements get mounted for the
    // newly-pushed cats).
    const [activeCount, setActiveCount] = useState(count);
    const [poses, setPoses] = useState<CatPose[]>(() => Array(count).fill('idle'));
    // Per-cat speech-bubble text. Pushed at the same throttled cadence as poses
    // (PUSH_POSE_MS) via publishThrottled in the rAF tick.
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

    // palettes is React state (not a useMemo of activeCount) so each cat's actual
    // palette — including user-picked coats from the tray — drives what gets
    // rendered. The previous index-derived useMemo only happened to match for the
    // initial cats; user-spawned cats with custom palettes ended up rendering as
    // whatever `paletteForIndex(spawnIndex)` returned.
    const [palettes, setPalettes] = useState<CatPalette[]>(() =>
        Array.from({ length: count }, (_, i) => paletteForIndex(i))
    );

    // Imperative spawn API used by both the in-effect shift+click handler AND the
    // drag-to-place tray in <AnimatedCats>. Pushes directly into statesRef.current
    // (so the rAF picks it up next tick) and bumps activeCount so React mounts a new
    // <div> for the cat. The optional `paletteKey` lets the caller pick the cat's
    // coat color (and therefore its personality via PALETTE_BEHAVIORS); omit it to
    // get the index-cycled default. Returns false at the cap so the UI can disable.
    const spawn = useCallback(
        (docX: number, docY: number, paletteKey?: string): boolean => {
            const states = statesRef.current;
            if (states.length >= MAX_CATS) return false;
            const idx = states.length;
            const palette = paletteKey
                ? (CAT_PALETTES[paletteKey] ?? paletteForIndex(idx))
                : paletteForIndex(idx);
            const behavior = paletteKey
                ? (PALETTE_BEHAVIORS[paletteKey] ?? 'chill')
                : behaviorForIndex(idx);
            // idx === states.length is the index this cat will occupy after the
            // push below — pass it to the cat-aware picker so the new cat's
            // first target dodges existing cats.
            const target = pickNearbyClearTarget(
                catSize,
                docX,
                docY,
                docDimsRef.current,
                obstaclesRef.current,
                states,
                idx,
                CAT_SPACING_RADIUS
            );
            const newCat = createInitialCatState({
                x: docX,
                y: docY,
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
            return true;
        },
        [catSize]
    );

    // Remove the most-recently-added cat. Pops from statesRef and drops the last
    // palette/message so the React renderer shrinks in lockstep.
    const removeLast = useCallback((): boolean => {
        const states = statesRef.current;
        if (states.length === 0) return false;
        states.pop();
        setActiveCount(states.length);
        setPalettes((prev) => prev.slice(0, -1));
        setMessages((prev) => prev.slice(0, -1));
        return true;
    }, []);

    // Replace the simulation with a fresh batch of initial cats. Wipes any user
    // spawns and any prior removals; cats jump to new random positions since
    // there's no meaningful way to preserve identity here.
    const reset = useCallback(() => {
        statesRef.current = Array.from({ length: count }, (_, i) =>
            spawnRandomCat(i, docDimsRef.current, catSize)
        );
        setActiveCount(count);
        setPalettes(Array.from({ length: count }, (_, i) => paletteForIndex(i)));
        setMessages(Array(count).fill(null));
    }, [count, catSize]);

    useEffect(() => {
        if (typeof window === 'undefined' || !enabled) return;

        docDimsRef.current = getDocDims();

        // Measure the doc-coord rects of every `[data-cat-obstacle]` element.
        // Stored in doc coords (rect + scrollX/Y at measure time) so the cache
        // stays valid across scroll without per-frame remeasurement.
        const measureObstacles = () => {
            const els = document.querySelectorAll<HTMLElement>(OBSTACLE_SELECTOR);
            const sx = window.scrollX;
            const sy = window.scrollY;
            const rects: ObstacleRect[] = [];
            els.forEach((el) => {
                const r = el.getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0) return;
                rects.push({
                    x: r.left + sx,
                    y: r.top + sy,
                    w: r.width,
                    h: r.height,
                });
            });
            obstaclesRef.current = rects;
        };
        measureObstacles();

        // Only initialize the initial set of cats once. Subsequent re-runs of this
        // effect (e.g. enabled toggling) reuse the existing simulation state, and
        // shift+click spawns push directly into statesRef.current without going
        // through this init path.
        if (statesRef.current.length === 0) {
            statesRef.current = Array.from({ length: count }, (_, i) =>
                spawnRandomCat(i, docDimsRef.current, catSize)
            );
        }

        // Throttle remeasures to one per frame; ResizeObserver can fire repeatedly
        // during the typewriter effect (terminal box growing each character).
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
            const cx = e.clientX + window.scrollX;
            const cy = e.clientY + window.scrollY;

            // Shift+click = power-user shortcut for the same spawn path that the
            // floating button drives. Skips the startle below.
            if (e.shiftKey) {
                spawn(cx, cy);
                return;
            }

            const states = statesRef.current;
            const now = performance.now();
            for (const cat of states) {
                if (cat.state === 'startled' || cat.state === 'fleeing') continue;
                const d = Math.hypot(cat.x - cx, cat.y - cy);
                if (d < CLICK_STARTLE_RADIUS) {
                    cat.state = 'startled';
                    cat.startleUntil = now + STARTLE_DURATION_MS;
                    cat.visitTarget = null;
                    const norm = Math.max(d, 1);
                    cat.targetX = cat.x + ((cat.x - cx) / norm) * 220;
                    cat.targetY = cat.y + ((cat.y - cy) / norm) * 220;
                    cat.facingLeft = cat.x < cx;
                    cat.distSinceFrame = 0;
                    setMessage(cat, 'startle', 1500);
                }
            }
        };
        const onResize = () => {
            // Re-measure the doc, then clamp every cat into the new bounds and nudge
            // idle cats toward a fresh target so they don't sit visibly off-doc.
            docDimsRef.current = getDocDims();
            measureObstacles();
            const dims = docDimsRef.current;
            const inset = catSize / 2;
            const topClamp = NAVBAR_HEIGHT + inset + NAVBAR_TOP_PAD;
            for (const cat of statesRef.current) {
                cat.x = Math.max(inset, Math.min(dims.width - inset, cat.x));
                cat.y = Math.max(topClamp, Math.min(dims.height - inset, cat.y));
                if (cat.state === 'idle' || cat.state === 'walking') {
                    const t = pickNearbyTarget(catSize, cat.x, cat.y, dims);
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                    if (cat.state === 'idle') {
                        cat.state = 'walking';
                        cat.sitAt = 0;
                    }
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
            // Convert cursor to DOCUMENT coords ONCE per frame. mouseRef stores
            // raw clientX/clientY so we add the current scroll offsets here;
            // scroll may have changed since the last mousemove, so this is
            // recomputed every frame even if the cursor hasn't moved.
            const mouseDoc = mouseRef.current
                ? {
                      x: mouseRef.current.vx + window.scrollX,
                      y: mouseRef.current.vy + window.scrollY,
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
            }

            lastPosesPushed = publishThrottled(
                now,
                states,
                setPoses,
                setMessages,
                lastPosesPushed
            );

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
        catRefs,
        bubbleRefs,
        enabled,
        count: activeCount,
        maxCount: MAX_CATS,
        spawn,
        removeLast,
        reset,
        isAtInitialCount: activeCount === count,
    };
}
