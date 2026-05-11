// src/utils/cats/tick/movement.ts
//
// The "move toward target" phase, plus the per-frame position clamp and the
// stuck-detection safety net. Returns the step distance so downstream phases
// (animation) can advance walk frames in sync with actual travel.
//
// Two main branches:
//  - idle: no target seek. Either wake up (cover or timer expired) and pick
//    a new target, or apply a gentle separation push so two cats can't stay
//    perfectly stacked.
//  - non-idle (walking | fleeing | visiting | startled): seek toward
//    cat.run.targetX/targetY. Combines seek with velocity-space avoidance;
//    visiting / fleeing / startled bypass avoidance.

import {
    AVOID_FALLOFF_POW,
    AVOID_STRENGTH,
    CAT_SPACING_RADIUS,
    COVER_SPEED_MULT,
    FACING_DEADBAND,
    FLEE_SPEED,
    IDLE_MAX_MS,
    IDLE_MIN_MS,
    IDLE_SEPARATION_STRENGTH,
    MEETUP_DISTANCE,
    NAVBAR_HEIGHT,
    NAVBAR_TOP_PAD,
    SIT_AFTER_MS,
    STARTLE_SPEED,
    STUCK_THRESHOLD_MS,
    VISIT_SPEED,
} from '../constants';
import { rng } from '../rng';
import {
    pickClearTarget,
    pickEscapeTarget,
    pickNearbyClearTarget,
    tooCloseToOtherCat,
} from '../targets';
import { asDoc, type CatRunState, type CatState } from '../types';
import type { TickContext } from './types';

// Per-state movement speed. Exhaustive switch so adding a new CatRunState
// variant (e.g. 'petting') forces an explicit speed decision — the trailing
// `never` assignment turns missing cases into a compile error.
function speedForRun(run: CatRunState, base: number): number {
    switch (run.kind) {
        case 'idle':
            return 0;
        case 'walking':
            return base;
        case 'visiting':
            return VISIT_SPEED;
        case 'fleeing':
            return FLEE_SPEED;
        case 'startled':
            return STARTLE_SPEED;
        default: {
            const _exhaustive: never = run;
            return _exhaustive;
        }
    }
}

// Returns the per-frame step distance (hypot of stepX, stepY). Mutates cat
// position, run-state, facingLeft, and lastProgressAt.
export function stepMovement(cat: CatState, ctx: TickContext, inCover: boolean): number {
    let stepX = 0;
    let stepY = 0;

    if (cat.run.kind === 'idle') {
        // If cover finds the cat sitting hidden, abandon the rest of the idle
        // window and start walking. Try the nearest cover edge first; fall
        // back to a far-off clear spot when no local escape exists. When
        // already visible, prefer a nearby target that stays in clear space.
        if (inCover || ctx.now >= cat.run.idleUntil) {
            let t: { x: typeof cat.x; y: typeof cat.y };
            const avoid = {
                states: ctx.states,
                selfIdx: ctx.i,
                spacing: CAT_SPACING_RADIUS,
            };
            if (inCover) {
                t =
                    pickEscapeTarget(cat.x, cat.y, ctx.catSize, ctx.dims, ctx.obstacles) ??
                    pickClearTarget(ctx.catSize, ctx.dims, ctx.obstacles, avoid);
            } else {
                t = pickNearbyClearTarget(
                    ctx.catSize,
                    cat.x,
                    cat.y,
                    ctx.dims,
                    ctx.obstacles,
                    avoid
                );
            }
            cat.run = { kind: 'walking', targetX: t.x, targetY: t.y };
            cat.lastProgressAt = ctx.now;
        } else {
            // Idle but not waking up yet. Velocity-space avoidance only runs
            // in the seek branch below (which is skipped for idle cats), so
            // without this pass two cats that go idle in overlapping
            // positions stay perfectly stacked forever. Squared falloff over
            // the full CAT_SPACING_RADIUS gives near-zero push at 60+px and
            // a meaningful push only as overlap grows.
            const radiusSq = CAT_SPACING_RADIUS * CAT_SPACING_RADIUS;
            let pushX = 0;
            let pushY = 0;
            for (let j = 0; j < ctx.states.length; j++) {
                if (j === ctx.i) continue;
                const other = ctx.states[j];
                // An idle cat can't itself be visiting anyone — only the
                // 'visiting' variant carries visitTarget — but other cats
                // visiting us are exempt from the push.
                if (other.run.kind === 'visiting' && other.run.visitTarget === ctx.i) continue;
                const dxN = cat.x - other.x;
                const dyN = cat.y - other.y;
                const distSq = dxN * dxN + dyN * dyN;
                if (distSq >= radiusSq || distSq === 0) continue;
                const distN = Math.sqrt(distSq);
                const falloff = (1 - distN / CAT_SPACING_RADIUS) ** AVOID_FALLOFF_POW;
                pushX += (dxN / distN) * falloff;
                pushY += (dyN / distN) * falloff;
            }
            cat.x = asDoc(cat.x + pushX * IDLE_SEPARATION_STRENGTH);
            cat.y = asDoc(cat.y + pushY * IDLE_SEPARATION_STRENGTH);
        }
    } else {
        // Non-idle: every remaining variant carries targetX/targetY.
        const dx = cat.run.targetX - cat.x;
        const dy = cat.run.targetY - cat.y;
        const dist = Math.hypot(dx, dy);
        // Face toward intent (the target) rather than this-frame motion.
        // Avoidance can swing the actual step vector across zero in dense
        // clusters; deriving facing from dx instead means the sprite tracks
        // where the cat is HEADING, not the noisy step-by-step velocity. The
        // FACING_DEADBAND keeps cats from flipping during the final approach
        // when |dx| decays to zero.
        if (Math.abs(dx) > FACING_DEADBAND) cat.facingLeft = dx < 0;
        let speed = speedForRun(cat.run, cat.speed);
        // Cover boost: cats out of sight should pop back into view fast.
        // Don't compound onto already-frantic states (flee/startle).
        if (inCover && cat.run.kind !== 'fleeing' && cat.run.kind !== 'startled') {
            speed *= COVER_SPEED_MULT;
        }

        if (dist < speed) {
            // Arrived-but-blocked guard: if landing on this target would put
            // the cat on another cat, repick instead of snapping/sitting on
            // top of someone. Only fires for ordinary walking — visiting
            // cats are SUPPOSED to land next to their partner, and in-cover
            // cats have their own escape logic that doesn't go through idle.
            const arrivedBlocked =
                cat.run.kind === 'walking' &&
                !inCover &&
                tooCloseToOtherCat(
                    cat.run.targetX,
                    cat.run.targetY,
                    ctx.i,
                    ctx.states,
                    MEETUP_DISTANCE
                );
            if (arrivedBlocked) {
                const t = pickNearbyClearTarget(
                    ctx.catSize,
                    cat.x,
                    cat.y,
                    ctx.dims,
                    ctx.obstacles,
                    { states: ctx.states, selfIdx: ctx.i, spacing: CAT_SPACING_RADIUS }
                );
                cat.run = { kind: 'walking', targetX: t.x, targetY: t.y };
                cat.lastProgressAt = ctx.now;
            } else {
                cat.x = cat.run.targetX;
                cat.y = cat.run.targetY;
                if (cat.run.kind === 'walking') {
                    if (inCover) {
                        // Reached the destination but still hidden — keep
                        // walking, aimed at the nearest exit edge or a
                        // far-off clear spot if no edge escape works.
                        const t =
                            pickEscapeTarget(cat.x, cat.y, ctx.catSize, ctx.dims, ctx.obstacles) ??
                            pickClearTarget(ctx.catSize, ctx.dims, ctx.obstacles, {
                                states: ctx.states,
                                selfIdx: ctx.i,
                                spacing: CAT_SPACING_RADIUS,
                            });
                        cat.run = { kind: 'walking', targetX: t.x, targetY: t.y };
                        cat.lastProgressAt = ctx.now;
                    } else {
                        cat.run = {
                            kind: 'idle',
                            idleUntil:
                                ctx.now + IDLE_MIN_MS + rng.next() * (IDLE_MAX_MS - IDLE_MIN_MS),
                            sitAt: ctx.now + SIT_AFTER_MS,
                        };
                    }
                }
            }
        } else {
            // Seek velocity (toward target).
            let seekX = (dx / dist) * speed;
            let seekY = (dy / dist) * speed;

            // Cat-cat avoidance combined with seek in VELOCITY SPACE.
            // Visiting cats and frantic states bypass this so meetups and
            // flee/startle motion are unaffected. Cat is necessarily
            // 'walking' here (the only remaining variant after we exclude
            // visiting/fleeing/startled), so it has no visitTarget of its
            // own; the visit-pair exemption only checks the OTHER cats.
            if (
                cat.run.kind !== 'visiting' &&
                cat.run.kind !== 'fleeing' &&
                cat.run.kind !== 'startled'
            ) {
                const radiusSq = CAT_SPACING_RADIUS * CAT_SPACING_RADIUS;
                let avoidX = 0;
                let avoidY = 0;
                for (let j = 0; j < ctx.states.length; j++) {
                    if (j === ctx.i) continue;
                    const other = ctx.states[j];
                    if (other.run.kind === 'visiting' && other.run.visitTarget === ctx.i) {
                        continue;
                    }
                    const dxN = cat.x - other.x;
                    const dyN = cat.y - other.y;
                    const distSq = dxN * dxN + dyN * dyN;
                    if (distSq >= radiusSq || distSq === 0) continue;
                    const distN = Math.sqrt(distSq);
                    const falloff = (1 - distN / CAT_SPACING_RADIUS) ** AVOID_FALLOFF_POW;
                    avoidX += (dxN / distN) * falloff;
                    avoidY += (dyN / distN) * falloff;
                }
                const avoidLen = Math.hypot(avoidX, avoidY);
                if (avoidLen > 0) {
                    const avoidUX = avoidX / avoidLen;
                    const avoidUY = avoidY / avoidLen;
                    // seek · avoidUnit > 0 => seek already aligned with
                    // avoid (moving away from neighbors). < 0 => seek
                    // points INTO the cluster; remove that component.
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
            cat.x = asDoc(cat.x + stepX);
            cat.y = asDoc(cat.y + stepY);
        }
    }

    return Math.hypot(stepX, stepY);
}

// Clamp the cat's position into the document bounds (with navbar top-pad).
// Called after stepMovement so any over-shoot from idle-separation or seek
// gets corrected before the transform write.
export function clampPosition(cat: CatState, ctx: TickContext): void {
    const inset = ctx.catSize / 2;
    const topClamp = NAVBAR_HEIGHT + inset + NAVBAR_TOP_PAD;
    cat.x = asDoc(Math.max(inset, Math.min(ctx.dims.width - inset, cat.x)));
    cat.y = asDoc(Math.max(topClamp, Math.min(ctx.dims.height - inset, cat.y)));
}

// Stuck-detection safety net. Avoidance can briefly cancel seek velocity in
// tight clusters; if a walking cat keeps making no progress for
// STUCK_THRESHOLD_MS we force a fresh target. Idle / visiting / flee /
// startle don't have this problem because they either don't have a walk
// target or bypass avoidance.
export function updateStuckCheck(cat: CatState, ctx: TickContext, stepDist: number): void {
    if (stepDist > 0.1) {
        cat.lastProgressAt = ctx.now;
        return;
    }
    if (cat.run.kind !== 'walking') return;
    if (ctx.now - cat.lastProgressAt <= STUCK_THRESHOLD_MS) return;
    const t = pickNearbyClearTarget(ctx.catSize, cat.x, cat.y, ctx.dims, ctx.obstacles, {
        states: ctx.states,
        selfIdx: ctx.i,
        spacing: CAT_SPACING_RADIUS,
    });
    cat.run = { kind: 'walking', targetX: t.x, targetY: t.y };
    cat.lastProgressAt = ctx.now;
}
