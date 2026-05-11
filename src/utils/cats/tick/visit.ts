// src/utils/cats/tick/visit.ts
//
// Track an active visit: aim toward the offset-from-target position; on
// arrival, fork on the target's personality (shy → startle the target and
// give up; otherwise → both go idle for the meetup pause).

import { setMessage } from '../bubbles';
import {
    MEETUP_DISTANCE,
    MEETUP_PAUSE_MS,
    STARTLE_DURATION_MS,
    VISIT_OFFSET,
} from '../constants';
import { pickNearbyTarget } from '../targets';
import type { CatState } from '../types';
import type { TickContext } from './types';

export function updateVisit(cat: CatState, ctx: TickContext): void {
    if (cat.state !== 'visiting' || cat.visitTarget === null) return;

    const tgt = ctx.states[cat.visitTarget];

    // Target became unavailable (fled, startled). Give up the visit.
    if (tgt.state === 'fleeing' || tgt.state === 'startled') {
        cat.state = 'walking';
        cat.visitTarget = null;
        const p = pickNearbyTarget(ctx.catSize, cat.x, cat.y, ctx.dims);
        cat.targetX = p.x;
        cat.targetY = p.y;
        return;
    }

    const dxv = tgt.x - cat.x;
    const dyv = tgt.y - cat.y;
    const distv = Math.hypot(dxv, dyv);

    // Not yet arrived — aim at an offset-from-target position so the visitor
    // sits beside the target rather than on top of them. The sign alternates
    // by index so two visitors approaching the same cat would land on
    // opposite sides (in practice the social-pick phase already prevents
    // two simultaneous visits to one cat).
    if (distv >= MEETUP_DISTANCE) {
        const offsetSign = ctx.i % 2 === 0 ? 1 : -1;
        cat.targetX = tgt.x + offsetSign * VISIT_OFFSET;
        cat.targetY = tgt.y;
        return;
    }

    // Arrived. Outcome depends on target's personality.
    if (tgt.behavior === 'shy') {
        // Shy target startles and dashes the opposite direction; visitor
        // gives up and picks a new walk target.
        tgt.state = 'startled';
        tgt.startleUntil = ctx.now + STARTLE_DURATION_MS;
        const dn = Math.max(distv, 1);
        tgt.targetX = tgt.x + (-dxv / dn) * 220;
        tgt.targetY = tgt.y + (-dyv / dn) * 220;
        tgt.facingLeft = -dxv < 0;
        tgt.visitTarget = null;
        setMessage(tgt, 'meetup_shy', 1500);

        cat.state = 'walking';
        cat.visitTarget = null;
        setMessage(cat, 'meetup_rebuffed');
        const p = pickNearbyTarget(ctx.catSize, cat.x, cat.y, ctx.dims);
        cat.targetX = p.x;
        cat.targetY = p.y;
        return;
    }

    // Friendly meetup. Both cats go idle for the meetup pause and sit down
    // shortly after. The target only joins if it's not already busy with
    // its own urgent state.
    cat.state = 'idle';
    cat.idleUntil = ctx.now + MEETUP_PAUSE_MS + Math.random() * 1500;
    cat.sitAt = ctx.now + 600;
    cat.visitTarget = null;
    cat.lastMeetupAt = ctx.now;
    setMessage(cat, 'meetup_friendly', 2500);

    if (tgt.state === 'walking' || tgt.state === 'idle') {
        tgt.state = 'idle';
        tgt.idleUntil = Math.max(tgt.idleUntil, ctx.now + MEETUP_PAUSE_MS);
        tgt.sitAt = ctx.now + 600;
        tgt.lastMeetupAt = ctx.now;
        setMessage(tgt, 'meetup_friendly', 2500);
    }
}
