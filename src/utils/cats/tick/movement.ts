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
//  - non-idle: seek toward target. Combines seek with velocity-space
//    avoidance — the component of seek that would point INTO a neighbor is
//    cancelled before applying. Visiting / fleeing / startled bypass avoidance.

import {
    AVOID_FALLOFF_POW,
    AVOID_STRENGTH,
    CAT_SPACING_RADIUS,
    COVER_SPEED_MULT,
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
import {
    pickClearTarget,
    pickEscapeTarget,
    pickNearbyClearTarget,
    tooCloseToOtherCat,
} from '../targets';
import type { CatState } from '../types';
import type { TickContext } from './types';

// Returns the per-frame step distance (hypot of stepX, stepY). Mutates cat
// position, target, state, sitAt/idleUntil, facingLeft, and lastProgressAt.
export function stepMovement(
    cat: CatState,
    ctx: TickContext,
    inCover: boolean
): number {
    let stepX = 0;
    let stepY = 0;

    if (cat.state === 'idle') {
        // If cover finds the cat sitting hidden, abandon the rest of the idle
        // window and start walking. Try the nearest cover edge first; fall
        // back to a far-off clear spot when no local escape exists. When
        // already visible, prefer a nearby target that stays in clear space.
        if (inCover || ctx.now >= cat.idleUntil) {
            cat.state = 'walking';
            cat.sitAt = 0;
            let t: { x: number; y: number };
            if (inCover) {
                t =
                    pickEscapeTarget(cat.x, cat.y, ctx.catSize, ctx.dims, ctx.obstacles) ??
                    pickClearTarget(
                        ctx.catSize,
                        ctx.dims,
                        ctx.obstacles,
                        ctx.states,
                        ctx.i,
                        CAT_SPACING_RADIUS
                    );
            } else {
                t = pickNearbyClearTarget(
                    ctx.catSize,
                    cat.x,
                    cat.y,
                    ctx.dims,
                    ctx.obstacles,
                    ctx.states,
                    ctx.i,
                    CAT_SPACING_RADIUS
                );
            }
            cat.targetX = t.x;
            cat.targetY = t.y;
            cat.lastProgressAt = ctx.now;
        } else {
            // Idle but not waking up yet. Velocity-space avoidance only runs
            // in the seek branch below (which is skipped for idle cats), so
            // without this pass two cats that go idle in overlapping
            // positions stay perfectly stacked forever. Squared falloff over
            // the full CAT_SPACING_RADIUS gives near-zero push at 60+px and
            // a meaningful push only as overlap grows — meetup pairs at
            // ~36px drift apart gently while truly stacked cats separate
            // faster. Visit-pair exemption is symmetric with the walking
            // case so an in-progress visit isn't shoved off course.
            const radiusSq = CAT_SPACING_RADIUS * CAT_SPACING_RADIUS;
            let pushX = 0;
            let pushY = 0;
            for (let j = 0; j < ctx.states.length; j++) {
                if (j === ctx.i) continue;
                const other = ctx.states[j];
                if (cat.visitTarget === j) continue;
                if (other.visitTarget === ctx.i) continue;
                const dxN = cat.x - other.x;
                const dyN = cat.y - other.y;
                const distSq = dxN * dxN + dyN * dyN;
                if (distSq >= radiusSq || distSq === 0) continue;
                const distN = Math.sqrt(distSq);
                const falloff = (1 - distN / CAT_SPACING_RADIUS) ** AVOID_FALLOFF_POW;
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
        if (inCover && cat.state !== 'fleeing' && cat.state !== 'startled') {
            speed *= COVER_SPEED_MULT;
        }

        if (dist < speed) {
            // Arrived-but-blocked guard: if landing on this target would put
            // the cat on another cat, repick instead of snapping/sitting on
            // top of someone. Only fires for ordinary walking — visiting
            // cats are SUPPOSED to land next to their partner, and in-cover
            // cats have their own escape logic that doesn't go through idle.
            const arrivedBlocked =
                cat.state === 'walking' &&
                !inCover &&
                tooCloseToOtherCat(cat.targetX, cat.targetY, ctx.i, ctx.states, MEETUP_DISTANCE);
            if (arrivedBlocked) {
                const t = pickNearbyClearTarget(
                    ctx.catSize,
                    cat.x,
                    cat.y,
                    ctx.dims,
                    ctx.obstacles,
                    ctx.states,
                    ctx.i,
                    CAT_SPACING_RADIUS
                );
                cat.targetX = t.x;
                cat.targetY = t.y;
                cat.lastProgressAt = ctx.now;
            } else {
                cat.x = cat.targetX;
                cat.y = cat.targetY;
                if (cat.state === 'walking') {
                    if (inCover) {
                        // Reached the destination but still hidden — keep
                        // walking, aimed at the nearest exit edge or a
                        // far-off clear spot if no edge escape works.
                        const t =
                            pickEscapeTarget(
                                cat.x,
                                cat.y,
                                ctx.catSize,
                                ctx.dims,
                                ctx.obstacles
                            ) ??
                            pickClearTarget(
                                ctx.catSize,
                                ctx.dims,
                                ctx.obstacles,
                                ctx.states,
                                ctx.i,
                                CAT_SPACING_RADIUS
                            );
                        cat.targetX = t.x;
                        cat.targetY = t.y;
                        cat.lastProgressAt = ctx.now;
                    } else {
                        cat.state = 'idle';
                        cat.idleUntil =
                            ctx.now +
                            IDLE_MIN_MS +
                            Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
                        cat.sitAt = ctx.now + SIT_AFTER_MS;
                    }
                }
            }
        } else {
            // Seek velocity (toward target).
            let seekX = (dx / dist) * speed;
            let seekY = (dy / dist) * speed;

            // Cat-cat avoidance combined with seek in VELOCITY SPACE.
            // Old code added a post-hoc position shove AFTER moving toward
            // the target, which the target attraction would immediately undo
            // the next frame — that caused the "keep retrying to go into one
            // another" oscillation. Here we cancel the component of seek
            // that points INTO neighbors before adding the avoid push.
            // Visiting cats and frantic states bypass this so meetups and
            // flee/startle motion are unaffected.
            if (
                cat.state !== 'visiting' &&
                cat.state !== 'fleeing' &&
                cat.state !== 'startled'
            ) {
                const radiusSq = CAT_SPACING_RADIUS * CAT_SPACING_RADIUS;
                let avoidX = 0;
                let avoidY = 0;
                for (let j = 0; j < ctx.states.length; j++) {
                    if (j === ctx.i) continue;
                    const other = ctx.states[j];
                    // Visiting pair exemption — symmetric, mirrors
                    // tooCloseToOtherCat — so playful cats can still close
                    // to MEETUP_DISTANCE for a successful visit.
                    if (cat.visitTarget === j) continue;
                    if (other.visitTarget === ctx.i) continue;
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
            cat.x += stepX;
            cat.y += stepY;
            if (Math.abs(stepX) > 0.05) cat.facingLeft = stepX < 0;
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
    cat.x = Math.max(inset, Math.min(ctx.dims.width - inset, cat.x));
    cat.y = Math.max(topClamp, Math.min(ctx.dims.height - inset, cat.y));
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
    if (cat.state !== 'walking') return;
    if (ctx.now - cat.lastProgressAt <= STUCK_THRESHOLD_MS) return;
    const t = pickNearbyClearTarget(
        ctx.catSize,
        cat.x,
        cat.y,
        ctx.dims,
        ctx.obstacles,
        ctx.states,
        ctx.i,
        CAT_SPACING_RADIUS
    );
    cat.targetX = t.x;
    cat.targetY = t.y;
    cat.lastProgressAt = ctx.now;
}
