// src/hooks/useAnimatedCats.ts
//
// Logic for the wandering pixel cats: simulation state, rAF loop, cursor/click/scroll
// handlers, and the throttled pose buffer that drives the React render. The component
// (AnimatedCats.tsx) only owns the JSX.
//
// Personality (paired with coat color via PALETTE_BEHAVIORS):
//   chill   — wanders aimlessly, doesn't seek out other cats
//   playful — periodically picks a nearby cat and walks over to "visit"; on contact
//             both pause briefly then go their separate ways
//   shy     — startles when another cat gets too close (or when clicked nearby)
//
// Reactions:
//   cursor — flee within FLEE_RADIUS until cursor leaves SAFE_RADIUS
//   click  — clicks within CLICK_STARTLE_RADIUS startle nearby cats
//   scroll — every cat freezes briefly with a scale-bump (alertUntil)

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { CAT_PALETTES, type CatPalette, type CatPose } from '@/types/pixel-cat';

type CatBehavior = 'chill' | 'playful' | 'shy';
type CatRunState = 'walking' | 'idle' | 'fleeing' | 'visiting' | 'startled';

interface CatState {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    speed: number;
    facingLeft: boolean;
    state: CatRunState;
    behavior: CatBehavior;
    idleUntil: number;
    sitAt: number;
    distSinceFrame: number;
    walkFrame: number;
    palette: CatPalette;
    visitTarget: number | null; // index of cat being visited
    nextSocialCheck: number; // earliest time this cat may initiate a visit
    startleUntil: number; // timestamp at which startle ends
    alertUntil: number; // freeze + scale bump until this time (e.g. on scroll)
}

interface UseAnimatedCatsParams {
    count: number;
    catSize: number;
}

export interface AnimatedCatsState {
    poses: CatPose[];
    palettes: CatPalette[];
    catRefs: RefObject<(HTMLDivElement | null)[]>;
    enabled: boolean;
}

const FLEE_RADIUS = 50;
const SAFE_RADIUS = 150;
const FLEE_SPEED = 2.0;
const STARTLE_SPEED = 5.0;
const WALK_SPEED = 0.55;
const VISIT_SPEED = 0.85; // visiting cats walk a bit faster — they have somewhere to be
const IDLE_MIN_MS = 2600;
const IDLE_MAX_MS = 6500;
const SIT_AFTER_MS = 450; // sit pose appears quickly so idle reads as "resting"
// Walk targets are picked WITHIN this radius of the cat's current position so transits
// don't span the whole viewport — keeps the idle/walk ratio feeling balanced.
const TARGET_MIN_DIST = 120;
const TARGET_MAX_DIST = 380;
// Scroll alert: freeze in place + scale bump for this long.
const SCROLL_ALERT_MS = 600;
const WALK_PIXELS_PER_FRAME = 14;
const RUN_PIXELS_PER_FRAME = 8;
const WALK_CYCLE_LEN = 6;
const RUN_CYCLE_LEN = 6;

const CLICK_STARTLE_RADIUS = 180;
const STARTLE_DURATION_MS = 700;

// Playful cats periodically scan for a friend within VISIT_RADIUS to walk over to.
const VISIT_RADIUS = 320;
const MEETUP_DISTANCE = 56; // close enough to count as "met"
const VISIT_OFFSET = 36; // sit beside, not on top of, the other cat
const SOCIAL_CHECK_INTERVAL_MS = 2400;
const MEETUP_PAUSE_MS = 1800;

const PUSH_POSE_MS = 90; // throttle React re-renders for pose changes

const PALETTE_KEYS = ['orange', 'black', 'gray', 'siamese'] as const;
// Personality is keyed by coat color so the same color is recognizably the same cat.
const PALETTE_BEHAVIORS: Record<string, CatBehavior> = {
    orange: 'chill',
    black: 'playful',
    gray: 'chill',
    siamese: 'shy',
};

function pickTarget(catSize: number) {
    const inset = catSize + 20;
    return {
        x: inset + Math.random() * Math.max(1, window.innerWidth - inset * 2),
        y: inset + Math.random() * Math.max(1, window.innerHeight - inset * 2),
    };
}

// Pick a target near the cat's current position rather than anywhere in the viewport.
// Falls back to global random if the local pick lands outside the safe area.
function pickNearbyTarget(catSize: number, fromX: number, fromY: number) {
    const inset = catSize + 20;
    const angle = Math.random() * Math.PI * 2;
    const dist = TARGET_MIN_DIST + Math.random() * (TARGET_MAX_DIST - TARGET_MIN_DIST);
    const x = fromX + Math.cos(angle) * dist;
    const y = fromY + Math.sin(angle) * dist;
    const minX = inset;
    const maxX = window.innerWidth - inset;
    const minY = inset;
    const maxY = window.innerHeight - inset;
    if (x < minX || x > maxX || y < minY || y > maxY) {
        return pickTarget(catSize);
    }
    return { x, y };
}

export function useAnimatedCats({ count, catSize }: UseAnimatedCatsParams): AnimatedCatsState {
    const catRefs = useRef<(HTMLDivElement | null)[]>([]);
    const statesRef = useRef<CatState[]>([]);
    const mouseRef = useRef<{ x: number; y: number } | null>(null);
    const rafRef = useRef<number | null>(null);
    const [poses, setPoses] = useState<CatPose[]>(() => Array(count).fill('idle'));
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

    const palettes = useMemo<CatPalette[]>(
        () =>
            Array.from(
                { length: count },
                (_, i) => CAT_PALETTES[PALETTE_KEYS[i % PALETTE_KEYS.length]]
            ),
        [count]
    );

    const behaviors = useMemo<CatBehavior[]>(
        () =>
            Array.from(
                { length: count },
                (_, i) => PALETTE_BEHAVIORS[PALETTE_KEYS[i % PALETTE_KEYS.length]] ?? 'chill'
            ),
        [count]
    );

    useEffect(() => {
        if (typeof window === 'undefined' || !enabled) return;

        statesRef.current = Array.from({ length: count }, (_, i) => {
            const start = pickTarget(catSize);
            const target = pickTarget(catSize);
            return {
                x: start.x,
                y: start.y,
                targetX: target.x,
                targetY: target.y,
                speed: WALK_SPEED * (0.75 + Math.random() * 0.5),
                facingLeft: target.x < start.x,
                state: 'walking' as const,
                behavior: behaviors[i],
                idleUntil: 0,
                sitAt: 0,
                distSinceFrame: 0,
                walkFrame: Math.floor(Math.random() * WALK_CYCLE_LEN),
                palette: palettes[i],
                visitTarget: null,
                nextSocialCheck: performance.now() + Math.random() * SOCIAL_CHECK_INTERVAL_MS,
                startleUntil: 0,
                alertUntil: 0,
            };
        });

        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        const onMouseLeave = () => {
            mouseRef.current = null;
        };
        const onClick = (e: MouseEvent) => {
            const cx = e.clientX;
            const cy = e.clientY;
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
                }
            }
        };
        const onScroll = () => {
            // Cats notice the page moving — they freeze, perk up, and look around briefly.
            const now = performance.now();
            for (const cat of statesRef.current) {
                if (cat.state === 'fleeing' || cat.state === 'startled') continue;
                cat.alertUntil = now + SCROLL_ALERT_MS;
            }
        };
        const onResize = () => {
            // Clamp every cat into the new viewport and nudge idle cats toward a fresh
            // target so they don't sit visibly off-screen waiting for idleUntil to expire.
            const inset = catSize / 2;
            for (const cat of statesRef.current) {
                cat.x = Math.max(inset, Math.min(window.innerWidth - inset, cat.x));
                cat.y = Math.max(inset, Math.min(window.innerHeight - inset, cat.y));
                if (cat.state === 'idle' || cat.state === 'walking') {
                    const t = pickNearbyTarget(catSize, cat.x, cat.y);
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
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        let lastPosesPushed = 0;

        const tick = () => {
            const now = performance.now();
            const states = statesRef.current;

            for (let i = 0; i < states.length; i++) {
                const cat = states[i];
                const el = catRefs.current[i];
                if (!el) continue;

                // Alert (e.g. on scroll): freeze in place; movement is skipped below.
                const isAlert = now < cat.alertUntil;

                // 1. Startle expiration → resume normal walking.
                if (cat.state === 'startled' && now >= cat.startleUntil) {
                    cat.state = 'walking';
                    const t = pickNearbyTarget(catSize, cat.x, cat.y);
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                }

                // 2. Cursor flee/safe (skipped while startled — startle takes precedence).
                if (cat.state !== 'startled' && mouseRef.current) {
                    const dxM = cat.x - mouseRef.current.x;
                    const dyM = cat.y - mouseRef.current.y;
                    const distM = Math.hypot(dxM, dyM);
                    if (cat.state !== 'fleeing' && distM < FLEE_RADIUS) {
                        cat.state = 'fleeing';
                        cat.visitTarget = null;
                    } else if (cat.state === 'fleeing' && distM > SAFE_RADIUS) {
                        cat.state = 'walking';
                        const t = pickTarget(catSize);
                        cat.targetX = t.x;
                        cat.targetY = t.y;
                    }
                    if (cat.state === 'fleeing' && distM > 0) {
                        cat.targetX = cat.x + (dxM / distM) * 220;
                        cat.targetY = cat.y + (dyM / distM) * 220;
                    }
                } else if (cat.state === 'fleeing' && !mouseRef.current) {
                    cat.state = 'walking';
                    const t = pickNearbyTarget(catSize, cat.x, cat.y);
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                }

                // 3. Social: playful cats may decide to visit a nearby cat.
                if (
                    cat.behavior === 'playful' &&
                    (cat.state === 'walking' || cat.state === 'idle') &&
                    now >= cat.nextSocialCheck
                ) {
                    cat.nextSocialCheck = now + SOCIAL_CHECK_INTERVAL_MS;
                    let nearestIdx = -1;
                    let nearestDist = VISIT_RADIUS;
                    for (let j = 0; j < states.length; j++) {
                        if (j === i) continue;
                        const other = states[j];
                        if (other.state === 'fleeing' || other.state === 'startled') continue;
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
                    }
                }

                // 4. Track visit target.
                if (cat.state === 'visiting' && cat.visitTarget !== null) {
                    const tgt = states[cat.visitTarget];
                    if (tgt.state === 'fleeing' || tgt.state === 'startled') {
                        // Friend got spooked — abandon the visit.
                        cat.state = 'walking';
                        cat.visitTarget = null;
                        const p = pickNearbyTarget(catSize, cat.x, cat.y);
                        cat.targetX = p.x;
                        cat.targetY = p.y;
                    } else {
                        const dxv = tgt.x - cat.x;
                        const dyv = tgt.y - cat.y;
                        const distv = Math.hypot(dxv, dyv);
                        if (distv < MEETUP_DISTANCE) {
                            // Met up. Shy cat? They flee. Otherwise both pause and chill.
                            if (tgt.behavior === 'shy') {
                                tgt.state = 'startled';
                                tgt.startleUntil = now + STARTLE_DURATION_MS;
                                const dn = Math.max(distv, 1);
                                tgt.targetX = tgt.x + (-dxv / dn) * 220;
                                tgt.targetY = tgt.y + (-dyv / dn) * 220;
                                tgt.facingLeft = -dxv < 0;
                                tgt.visitTarget = null;
                                // Visitor: a little disappointed, walks somewhere else.
                                cat.state = 'walking';
                                cat.visitTarget = null;
                                const p = pickNearbyTarget(catSize, cat.x, cat.y);
                                cat.targetX = p.x;
                                cat.targetY = p.y;
                            } else {
                                cat.state = 'idle';
                                cat.idleUntil = now + MEETUP_PAUSE_MS + Math.random() * 1500;
                                cat.sitAt = now + 600;
                                cat.visitTarget = null;
                                if (tgt.state === 'walking' || tgt.state === 'idle') {
                                    tgt.state = 'idle';
                                    tgt.idleUntil = Math.max(tgt.idleUntil, now + MEETUP_PAUSE_MS);
                                    tgt.sitAt = now + 600;
                                }
                            }
                        } else {
                            // Update pursuit target each tick so we track moving cats.
                            const offsetSign = i % 2 === 0 ? 1 : -1;
                            cat.targetX = tgt.x + offsetSign * VISIT_OFFSET;
                            cat.targetY = tgt.y;
                        }
                    }
                }

                // 5. Move toward current target (or expire idle).
                let stepX = 0;
                let stepY = 0;

                if (isAlert) {
                    // Frozen in place. Skip movement entirely; transform applies scale bump.
                } else if (cat.state === 'idle') {
                    if (now >= cat.idleUntil) {
                        cat.state = 'walking';
                        cat.sitAt = 0;
                        const t = pickNearbyTarget(catSize, cat.x, cat.y);
                        cat.targetX = t.x;
                        cat.targetY = t.y;
                    }
                } else {
                    const dx = cat.targetX - cat.x;
                    const dy = cat.targetY - cat.y;
                    const dist = Math.hypot(dx, dy);
                    let speed = cat.speed;
                    if (cat.state === 'fleeing') speed = FLEE_SPEED;
                    else if (cat.state === 'startled') speed = STARTLE_SPEED;
                    else if (cat.state === 'visiting') speed = VISIT_SPEED;
                    if (dist < speed) {
                        cat.x = cat.targetX;
                        cat.y = cat.targetY;
                        if (cat.state === 'walking') {
                            cat.state = 'idle';
                            cat.idleUntil =
                                now + IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
                            cat.sitAt = now + SIT_AFTER_MS;
                        }
                    } else {
                        stepX = (dx / dist) * speed;
                        stepY = (dy / dist) * speed;
                        cat.x += stepX;
                        cat.y += stepY;
                        if (Math.abs(stepX) > 0.05) cat.facingLeft = stepX < 0;
                    }
                }

                // Clamp to viewport
                const inset = catSize / 2;
                cat.x = Math.max(inset, Math.min(window.innerWidth - inset, cat.x));
                cat.y = Math.max(inset, Math.min(window.innerHeight - inset, cat.y));

                // Walk frame advance
                const stepDist = Math.hypot(stepX, stepY);
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
                let scale = 1;
                if (cat.state === 'startled') {
                    scale = 1.18;
                } else if (isAlert) {
                    // Smooth sine bump: peaks at the middle of the alert window, returns to 1.
                    const t = (cat.alertUntil - now) / SCROLL_ALERT_MS;
                    scale = 1 + 0.18 * Math.sin(Math.max(0, Math.min(1, t)) * Math.PI);
                }
                el.style.transform = `translate(${cat.x - catSize / 2}px, ${
                    cat.y - catSize / 2
                }px) scale(${flipX * scale}, ${scale}) rotate(${tilt}deg)`;
            }

            // Compute next poses and push to React if changed (throttled).
            if (now - lastPosesPushed >= PUSH_POSE_MS) {
                const nextPoses: CatPose[] = states.map((cat) => {
                    if (now < cat.alertUntil) {
                        return 'idle'; // ears-up, frozen
                    }
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
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
        };
    }, [count, catSize, palettes, behaviors, enabled]);

    return { poses, palettes, catRefs, enabled };
}
