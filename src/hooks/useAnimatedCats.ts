// src/hooks/useAnimatedCats.ts
//
// Top-level state + rAF lifecycle for the animated-cats overlay. Pure helpers,
// types, constants, palette tables, bubble pools, and the initial-state
// factory all live under `src/utils/cats/*` — this file is now focused on
// React state plumbing, refs, the imperative API (spawn / removeLast / reset),
// and the per-frame tick. The tick body still lives inline; a follow-up
// commit splits it into phase functions under `src/utils/cats/tick/*`.
//
// Cats live in DOCUMENT coords, not viewport: the overlay is positioned
// absolutely over the full page, cats roam the whole document, and you scroll
// past them. Cursor proximity is computed in doc coords by adding
// window.scrollX/Y to clientX/clientY each frame.
//
// Reactions:
//   cursor — flee within FLEE_RADIUS until cursor leaves SAFE_RADIUS
//   click  — clicks within CLICK_STARTLE_RADIUS startle nearby cats; shift+click spawns
//   resize — re-measure obstacles + clamp every cat into new bounds
//   scroll — no reaction; cats are doc-anchored so the page just slides past them
//
// Personality (paired with coat color via PALETTE_BEHAVIORS):
//   chill   — wanders aimlessly, doesn't seek out other cats
//   playful — periodically picks a nearby cat and walks over to "visit"
//   shy     — startles when another cat gets too close (or when clicked nearby)

import { useCallback, useEffect, useRef, useState } from 'react';
import { CAT_PALETTES, type CatPalette, type CatPose } from '@/types/pixel-cat';
import {
    AVOID_FALLOFF_POW,
    AVOID_STRENGTH,
    CAT_SPACING_RADIUS,
    CLICK_STARTLE_RADIUS,
    COVER_SPEED_MULT,
    FLEE_RADIUS,
    FLEE_SPEED,
    IDLE_MAX_MS,
    IDLE_MIN_MS,
    IDLE_SEPARATION_STRENGTH,
    MAX_CATS,
    MEETUP_COOLDOWN_MS,
    MEETUP_DISTANCE,
    MEETUP_PAUSE_MS,
    NAVBAR_HEIGHT,
    NAVBAR_TOP_PAD,
    OBSTACLE_SELECTOR,
    PUSH_POSE_MS,
    RUN_CYCLE_LEN,
    RUN_PIXELS_PER_FRAME,
    SAFE_RADIUS,
    SIT_AFTER_MS,
    SOCIAL_CHECK_INTERVAL_MS,
    STARTLE_DURATION_MS,
    STARTLE_SPEED,
    VISIT_OFFSET,
    VISIT_RADIUS,
    VISIT_SPEED,
    WALK_CYCLE_LEN,
    WALK_PIXELS_PER_FRAME,
    STUCK_THRESHOLD_MS,
} from '@/utils/cats/constants';
import { setMessage } from '@/utils/cats/bubbles';
import { createInitialCatState, spawnRandomCat } from '@/utils/cats/factory';
import {
    PALETTE_BEHAVIORS,
    behaviorForIndex,
    paletteForIndex,
} from '@/utils/cats/palette';
import {
    getDocDims,
    pickClearTarget,
    pickEscapeTarget,
    pickNearbyClearTarget,
    pickNearbyTarget,
    tooCloseToOtherCat,
} from '@/utils/cats/targets';
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
    // Per-cat speech-bubble text. Pushed at the same throttled cadence as
    // poses (PUSH_POSE_MS) — see the tick body for the equality-checked push.
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
    // palette/message so the React renderer (which reads palettes[i]) shrinks in
    // lockstep.
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

        // Measure the doc-coord rects of every `[data-cat-obstacle]` element. Stored
        // in doc coords (rect + scrollX/Y at measure time) so the cache stays valid
        // across scroll without per-frame remeasurement.
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

            for (let i = 0; i < states.length; i++) {
                const cat = states[i];
                const el = catRefs.current[i];
                if (!el) continue;

                // 1. Startle expiration → resume normal walking.
                if (cat.state === 'startled' && now >= cat.startleUntil) {
                    cat.state = 'walking';
                    const t = pickNearbyClearTarget(
                        catSize,
                        cat.x,
                        cat.y,
                        dims,
                        obstaclesRef.current,
                        states,
                        i,
                        CAT_SPACING_RADIUS
                    );
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                    cat.lastProgressAt = now;
                }

                // 2. Cursor flee/safe (skipped while startled — startle takes precedence).
                if (cat.state !== 'startled' && mouseRef.current) {
                    const mx = mouseRef.current.vx + window.scrollX;
                    const my = mouseRef.current.vy + window.scrollY;
                    const dxM = cat.x - mx;
                    const dyM = cat.y - my;
                    const distM = Math.hypot(dxM, dyM);
                    if (cat.state !== 'fleeing' && distM < FLEE_RADIUS) {
                        cat.state = 'fleeing';
                        cat.visitTarget = null;
                        setMessage(cat, 'flee_start', 1500);
                    } else if (cat.state === 'fleeing' && distM > SAFE_RADIUS) {
                        cat.state = 'walking';
                        const t = pickNearbyClearTarget(
                            catSize,
                            cat.x,
                            cat.y,
                            dims,
                            obstaclesRef.current,
                            states,
                            i,
                            CAT_SPACING_RADIUS
                        );
                        cat.targetX = t.x;
                        cat.targetY = t.y;
                        cat.lastProgressAt = now;
                    }
                    if (cat.state === 'fleeing' && distM > 0) {
                        cat.targetX = cat.x + (dxM / distM) * 220;
                        cat.targetY = cat.y + (dyM / distM) * 220;
                    }
                } else if (cat.state === 'fleeing' && !mouseRef.current) {
                    cat.state = 'walking';
                    const t = pickNearbyClearTarget(
                        catSize,
                        cat.x,
                        cat.y,
                        dims,
                        obstaclesRef.current,
                        states,
                        i,
                        CAT_SPACING_RADIUS
                    );
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                    cat.lastProgressAt = now;
                }

                // 3. Social: playful cats may decide to visit a nearby cat.
                // Cooldowns prevent two filter-failures that caused visible
                // cluster cascades:
                //   - skip cats that just finished a meetup (lastMeetupAt)
                //     so a freshly-met chill cat isn't immediately re-targeted
                //     by another playful cat,
                //   - skip cats that are currently the target of someone else's
                //     active visit so two playful cats don't converge on the
                //     same chill cat simultaneously.
                if (
                    cat.behavior === 'playful' &&
                    (cat.state === 'walking' || cat.state === 'idle') &&
                    now >= cat.nextSocialCheck
                ) {
                    cat.nextSocialCheck = now + SOCIAL_CHECK_INTERVAL_MS;
                    if (now - cat.lastMeetupAt >= MEETUP_COOLDOWN_MS) {
                        let nearestIdx = -1;
                        let nearestDist = VISIT_RADIUS;
                        for (let j = 0; j < states.length; j++) {
                            if (j === i) continue;
                            const other = states[j];
                            if (other.state === 'fleeing' || other.state === 'startled') {
                                continue;
                            }
                            if (now - other.lastMeetupAt < MEETUP_COOLDOWN_MS) continue;
                            // Skip if another cat is already visiting this one.
                            let alreadyTargeted = false;
                            for (let k = 0; k < states.length; k++) {
                                if (k === i || k === j) continue;
                                if (states[k].visitTarget === j) {
                                    alreadyTargeted = true;
                                    break;
                                }
                            }
                            if (alreadyTargeted) continue;
                            const d = Math.hypot(other.x - cat.x, other.y - cat.y);
                            if (d > MEETUP_DISTANCE && d < nearestDist) {
                                nearestIdx = j;
                                nearestDist = d;
                            }
                        }
                        if (nearestIdx >= 0) {
                            cat.state = 'visiting';
                            cat.visitTarget = nearestIdx;
                            cat.idleUntil = 0;
                            setMessage(cat, 'visit_start');
                        }
                    }
                }

                // 4. Track visit target.
                if (cat.state === 'visiting' && cat.visitTarget !== null) {
                    const tgt = states[cat.visitTarget];
                    if (tgt.state === 'fleeing' || tgt.state === 'startled') {
                        cat.state = 'walking';
                        cat.visitTarget = null;
                        const p = pickNearbyTarget(catSize, cat.x, cat.y, dims);
                        cat.targetX = p.x;
                        cat.targetY = p.y;
                    } else {
                        const dxv = tgt.x - cat.x;
                        const dyv = tgt.y - cat.y;
                        const distv = Math.hypot(dxv, dyv);
                        if (distv < MEETUP_DISTANCE) {
                            if (tgt.behavior === 'shy') {
                                tgt.state = 'startled';
                                tgt.startleUntil = now + STARTLE_DURATION_MS;
                                const dn = Math.max(distv, 1);
                                tgt.targetX = tgt.x + (-dxv / dn) * 220;
                                tgt.targetY = tgt.y + (-dyv / dn) * 220;
                                tgt.facingLeft = -dxv < 0;
                                tgt.visitTarget = null;
                                setMessage(tgt, 'meetup_shy', 1500);
                                cat.state = 'walking';
                                cat.visitTarget = null;
                                setMessage(cat, 'meetup_rebuffed');
                                const p = pickNearbyTarget(catSize, cat.x, cat.y, dims);
                                cat.targetX = p.x;
                                cat.targetY = p.y;
                            } else {
                                cat.state = 'idle';
                                cat.idleUntil = now + MEETUP_PAUSE_MS + Math.random() * 1500;
                                cat.sitAt = now + 600;
                                cat.visitTarget = null;
                                cat.lastMeetupAt = now;
                                setMessage(cat, 'meetup_friendly', 2500);
                                if (tgt.state === 'walking' || tgt.state === 'idle') {
                                    tgt.state = 'idle';
                                    tgt.idleUntil = Math.max(tgt.idleUntil, now + MEETUP_PAUSE_MS);
                                    tgt.sitAt = now + 600;
                                    tgt.lastMeetupAt = now;
                                    setMessage(tgt, 'meetup_friendly', 2500);
                                }
                            }
                        } else {
                            const offsetSign = i % 2 === 0 ? 1 : -1;
                            cat.targetX = tgt.x + offsetSign * VISIT_OFFSET;
                            cat.targetY = tgt.y;
                        }
                    }
                }

                // 5. Cover detection: AABB-test the cat's bbox against every cached
                // obstacle rect. When in cover the cat is hidden behind content, so
                // the simulation reacts by speeding the cat up and refusing to let
                // it sit idle there. The check is per-frame but cheap (typically
                // ~10 obstacles × 8 cats = 80 comparisons).
                const halfSize = catSize / 2;
                const catL = cat.x - halfSize;
                const catT = cat.y - halfSize;
                const catR = cat.x + halfSize;
                const catB = cat.y + halfSize;
                const obs = obstaclesRef.current;
                let inCover = false;
                for (let k = 0; k < obs.length; k++) {
                    const o = obs[k];
                    if (catL < o.x + o.w && catR > o.x && catT < o.y + o.h && catB > o.y) {
                        inCover = true;
                        break;
                    }
                }

                // 6. Move toward current target (or expire idle).
                let stepX = 0;
                let stepY = 0;

                if (cat.state === 'idle') {
                    // If cover finds the cat sitting hidden, abandon the rest of the
                    // idle window and start walking. Try the nearest cover edge
                    // first; fall back to a far-off clear spot when no local escape
                    // exists (e.g. center of a near-full-width obstacle). When
                    // already visible, prefer a nearby target that ALSO stays in
                    // clear space — keeps roaming cats inside their current gap
                    // instead of walking straight back into cover.
                    if (inCover || now >= cat.idleUntil) {
                        cat.state = 'walking';
                        cat.sitAt = 0;
                        let t: { x: number; y: number };
                        if (inCover) {
                            // Escape edge picker is geometry-only (no cat awareness)
                            // — getting out of cover takes priority over respecting
                            // cat spacing. The clear-target fallback DOES respect
                            // spacing so we don't pop out next to another cat.
                            t =
                                pickEscapeTarget(cat.x, cat.y, catSize, dims, obs) ??
                                pickClearTarget(
                                    catSize,
                                    dims,
                                    obs,
                                    states,
                                    i,
                                    CAT_SPACING_RADIUS
                                );
                        } else {
                            t = pickNearbyClearTarget(
                                catSize,
                                cat.x,
                                cat.y,
                                dims,
                                obs,
                                states,
                                i,
                                CAT_SPACING_RADIUS
                            );
                        }
                        cat.targetX = t.x;
                        cat.targetY = t.y;
                        cat.lastProgressAt = now;
                    } else {
                        // Idle but not waking up yet. Velocity-space avoidance
                        // only runs in the seek branch below (which is skipped
                        // for idle cats), so without this pass two cats that
                        // go idle in overlapping positions stay stacked forever.
                        const radiusSq = CAT_SPACING_RADIUS * CAT_SPACING_RADIUS;
                        let pushX = 0;
                        let pushY = 0;
                        for (let j = 0; j < states.length; j++) {
                            if (j === i) continue;
                            const other = states[j];
                            if (cat.visitTarget === j) continue;
                            if (other.visitTarget === i) continue;
                            const dxN = cat.x - other.x;
                            const dyN = cat.y - other.y;
                            const distSq = dxN * dxN + dyN * dyN;
                            if (distSq >= radiusSq || distSq === 0) continue;
                            const distN = Math.sqrt(distSq);
                            const falloff =
                                (1 - distN / CAT_SPACING_RADIUS) ** AVOID_FALLOFF_POW;
                            pushX += (dxN / distN) * falloff;
                            pushY += (dyN / distN) * falloff;
                        }
                        cat.x += pushX * IDLE_SEPARATION_STRENGTH;
                        cat.y += pushY * IDLE_SEPARATION_STRENGTH;
                    }
                } else {
                    const dx = cat.targetX - cat.x;
                    const dy = cat.targetY - cat.y;
                    const dist = Math.hypot(dx, dy);
                    let speed = cat.speed;
                    if (cat.state === 'fleeing') speed = FLEE_SPEED;
                    else if (cat.state === 'startled') speed = STARTLE_SPEED;
                    else if (cat.state === 'visiting') speed = VISIT_SPEED;
                    // Cover boost: cats out of sight should pop back into view fast.
                    // Don't compound onto already-frantic states (flee/startle).
                    if (
                        inCover &&
                        cat.state !== 'fleeing' &&
                        cat.state !== 'startled'
                    ) {
                        speed *= COVER_SPEED_MULT;
                    }
                    if (dist < speed) {
                        // Arrived-but-blocked guard: if landing on this target
                        // would put the cat on another cat, repick instead of
                        // snapping/sitting on top of someone. Only fires for
                        // ordinary walking — visiting cats are SUPPOSED to land
                        // next to their partner, and in-cover cats have their
                        // own escape logic that doesn't go through idle anyway.
                        const arrivedBlocked =
                            cat.state === 'walking' &&
                            !inCover &&
                            tooCloseToOtherCat(
                                cat.targetX,
                                cat.targetY,
                                i,
                                states,
                                MEETUP_DISTANCE
                            );
                        if (arrivedBlocked) {
                            const t = pickNearbyClearTarget(
                                catSize,
                                cat.x,
                                cat.y,
                                dims,
                                obs,
                                states,
                                i,
                                CAT_SPACING_RADIUS
                            );
                            cat.targetX = t.x;
                            cat.targetY = t.y;
                            cat.lastProgressAt = now;
                        } else {
                            cat.x = cat.targetX;
                            cat.y = cat.targetY;
                            if (cat.state === 'walking') {
                                if (inCover) {
                                    // Reached the destination but still hidden —
                                    // keep walking, aimed at the nearest exit edge
                                    // or a far-off clear spot if no edge escape
                                    // works.
                                    const t =
                                        pickEscapeTarget(
                                            cat.x,
                                            cat.y,
                                            catSize,
                                            dims,
                                            obs
                                        ) ??
                                        pickClearTarget(
                                            catSize,
                                            dims,
                                            obs,
                                            states,
                                            i,
                                            CAT_SPACING_RADIUS
                                        );
                                    cat.targetX = t.x;
                                    cat.targetY = t.y;
                                    cat.lastProgressAt = now;
                                } else {
                                    cat.state = 'idle';
                                    cat.idleUntil =
                                        now +
                                        IDLE_MIN_MS +
                                        Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
                                    cat.sitAt = now + SIT_AFTER_MS;
                                }
                            }
                        }
                    } else {
                        // Seek velocity (toward target).
                        let seekX = (dx / dist) * speed;
                        let seekY = (dy / dist) * speed;

                        // Cat-cat avoidance combined with seek in VELOCITY SPACE.
                        // Old code added a post-hoc position shove AFTER moving
                        // toward the target, which the target attraction would
                        // immediately undo the next frame — that's what caused
                        // the "keep retrying to go into one another" oscillation.
                        // Visiting cats and frantic states bypass this so meetups
                        // and flee/startle motion are unaffected.
                        if (
                            cat.state !== 'visiting' &&
                            cat.state !== 'fleeing' &&
                            cat.state !== 'startled'
                        ) {
                            const radiusSq =
                                CAT_SPACING_RADIUS * CAT_SPACING_RADIUS;
                            let avoidX = 0;
                            let avoidY = 0;
                            for (let j = 0; j < states.length; j++) {
                                if (j === i) continue;
                                const other = states[j];
                                if (cat.visitTarget === j) continue;
                                if (other.visitTarget === i) continue;
                                const dxN = cat.x - other.x;
                                const dyN = cat.y - other.y;
                                const distSq = dxN * dxN + dyN * dyN;
                                if (distSq >= radiusSq || distSq === 0) continue;
                                const distN = Math.sqrt(distSq);
                                const falloff =
                                    (1 - distN / CAT_SPACING_RADIUS) **
                                    AVOID_FALLOFF_POW;
                                avoidX += (dxN / distN) * falloff;
                                avoidY += (dyN / distN) * falloff;
                            }
                            const avoidLen = Math.hypot(avoidX, avoidY);
                            if (avoidLen > 0) {
                                const avoidUX = avoidX / avoidLen;
                                const avoidUY = avoidY / avoidLen;
                                // seek · avoidUnit > 0 => seek already aligned
                                // with avoid (moving away from neighbors). < 0 =>
                                // seek points INTO the cluster; remove that
                                // component.
                                const seekProj = seekX * avoidUX + seekY * avoidUY;
                                if (seekProj < 0) {
                                    seekX -= seekProj * avoidUX;
                                    seekY -= seekProj * avoidUY;
                                }
                                seekX += avoidX * AVOID_STRENGTH;
                                seekY += avoidY * AVOID_STRENGTH;
                            }
                        }

                        // Clamp final step to the cat's max speed for this frame.
                        const stepLen = Math.hypot(seekX, seekY);
                        if (stepLen > speed && stepLen > 0) {
                            seekX = (seekX / stepLen) * speed;
                            seekY = (seekY / stepLen) * speed;
                        }
                        stepX = seekX;
                        stepY = seekY;
                        cat.x += stepX;
                        cat.y += stepY;
                        if (Math.abs(stepX) > 0.05) cat.facingLeft = stepX < 0;
                    }
                }

                const inset = catSize / 2;
                const topClamp = NAVBAR_HEIGHT + inset + NAVBAR_TOP_PAD;
                cat.x = Math.max(inset, Math.min(dims.width - inset, cat.x));
                cat.y = Math.max(topClamp, Math.min(dims.height - inset, cat.y));

                const stepDist = Math.hypot(stepX, stepY);

                // Stuck-detection safety net. Avoidance can briefly cancel seek
                // velocity in tight clusters; if a walking cat keeps making no
                // progress for STUCK_THRESHOLD_MS we force a fresh target.
                if (stepDist > 0.1) {
                    cat.lastProgressAt = now;
                } else if (
                    cat.state === 'walking' &&
                    now - cat.lastProgressAt > STUCK_THRESHOLD_MS
                ) {
                    const t = pickNearbyClearTarget(
                        catSize,
                        cat.x,
                        cat.y,
                        dims,
                        obs,
                        states,
                        i,
                        CAT_SPACING_RADIUS
                    );
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                    cat.lastProgressAt = now;
                }

                cat.distSinceFrame += stepDist;
                const isRunning = cat.state === 'fleeing' || cat.state === 'startled';
                const stride = isRunning ? RUN_PIXELS_PER_FRAME : WALK_PIXELS_PER_FRAME;
                const cycleLen = isRunning ? RUN_CYCLE_LEN : WALK_CYCLE_LEN;
                if (cat.distSinceFrame >= stride) {
                    cat.distSinceFrame = 0;
                    cat.walkFrame = (cat.walkFrame + 1) % cycleLen;
                }

                const flipX = cat.facingLeft ? -1 : 1;
                const tilt = isRunning ? (cat.facingLeft ? 6 : -6) : 0;
                const scale = cat.state === 'startled' ? 1.18 : 1;
                el.style.transform = `translate(${cat.x - catSize / 2}px, ${
                    cat.y - catSize / 2
                }px) scale(${flipX * scale}, ${scale}) rotate(${tilt}deg)`;

                // Speech bubble: clear expired messages, then translate the
                // bubble element to sit above the cat. Translate-only (no
                // scale/flip) so text always reads upright. The bubble's own
                // CSS handles horizontal centering via -translate-x-1/2.
                if (cat.message && now >= cat.messageUntil) {
                    cat.message = null;
                    cat.messageUntil = 0;
                }
                const bubbleEl = bubbleRefs.current[i];
                if (bubbleEl) {
                    const bubbleY = cat.y - catSize / 2 - Math.round(catSize * 0.35);
                    bubbleEl.style.transform = `translate(${cat.x}px, ${bubbleY}px)`;
                }
            }

            // Compute next poses and push to React if changed (throttled).
            if (now - lastPosesPushed >= PUSH_POSE_MS) {
                const nextPoses: CatPose[] = states.map((cat) => {
                    if (cat.state === 'idle') {
                        return cat.sitAt && now >= cat.sitAt ? 'sit' : 'idle';
                    }
                    if (cat.state === 'fleeing' || cat.state === 'startled') {
                        return `run${cat.walkFrame % RUN_CYCLE_LEN}` as CatPose;
                    }
                    return `walk${cat.walkFrame % WALK_CYCLE_LEN}` as CatPose;
                });
                setPoses((prev) => {
                    let same = prev.length === nextPoses.length;
                    if (same) {
                        for (let k = 0; k < prev.length; k++) {
                            if (prev[k] !== nextPoses[k]) {
                                same = false;
                                break;
                            }
                        }
                    }
                    return same ? prev : nextPoses;
                });
                // Mirror the poses push for bubble messages — same throttle
                // clock, same equality short-circuit. React only re-renders
                // the bubble overlay when a phrase appears/disappears/changes.
                const nextMessages: (string | null)[] = states.map((cat) => cat.message);
                setMessages((prev) => {
                    let same = prev.length === nextMessages.length;
                    if (same) {
                        for (let k = 0; k < prev.length; k++) {
                            if (prev[k] !== nextMessages[k]) {
                                same = false;
                                break;
                            }
                        }
                    }
                    return same ? prev : nextMessages;
                });
                lastPosesPushed = now;
            }

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
