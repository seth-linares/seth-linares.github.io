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
import { asDoc, type CatState } from '../types';
import type { TickContext } from './types';

export function updateVisit(cat: CatState, ctx: TickContext): void {
    if (cat.run.kind !== 'visiting') return;

    const tgt = ctx.states[cat.run.visitTarget];

    // Target became unavailable (fled, startled). Give up the visit.
    if (tgt.run.kind === 'fleeing' || tgt.run.kind === 'startled') {
        const p = pickNearbyTarget(ctx.catSize, cat.x, cat.y, ctx.dims);
        cat.run = { kind: 'walking', targetX: p.x, targetY: p.y };
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
        cat.run.targetX = asDoc(tgt.x + offsetSign * VISIT_OFFSET);
        cat.run.targetY = tgt.y;
        return;
    }

    // Arrived. Outcome depends on target's personality.
    if (tgt.behavior === 'shy') {
        // Shy target startles and dashes the opposite direction; visitor
        // gives up and picks a new walk target.
        const dn = Math.max(distv, 1);
        tgt.run = {
            kind: 'startled',
            startleUntil: ctx.now + STARTLE_DURATION_MS,
            targetX: asDoc(tgt.x + (-dxv / dn) * 220),
            targetY: asDoc(tgt.y + (-dyv / dn) * 220),
        };
        tgt.facingLeft = -dxv < 0;
        setMessage(tgt, 'meetup_shy', 1500);

        setMessage(cat, 'meetup_rebuffed');
        const p = pickNearbyTarget(ctx.catSize, cat.x, cat.y, ctx.dims);
        cat.run = { kind: 'walking', targetX: p.x, targetY: p.y };
        return;
    }

    // Friendly meetup. Both cats go idle for the meetup pause and sit down
    // shortly after. The target only joins if it's not already busy with
    // its own urgent state.
    cat.run = {
        kind: 'idle',
        idleUntil: ctx.now + MEETUP_PAUSE_MS + Math.random() * 1500,
        sitAt: ctx.now + 600,
    };
    cat.lastMeetupAt = ctx.now;
    setMessage(cat, 'meetup_friendly', 2500);

    if (tgt.run.kind === 'walking' || tgt.run.kind === 'idle') {
        // Preserve max(existing idleUntil, new floor) — only the 'idle'
        // variant carries idleUntil; treat 'walking' as no prior floor.
        const existingIdleUntil = tgt.run.kind === 'idle' ? tgt.run.idleUntil : 0;
        tgt.run = {
            kind: 'idle',
            idleUntil: Math.max(existingIdleUntil, ctx.now + MEETUP_PAUSE_MS),
            sitAt: ctx.now + 600,
        };
        tgt.lastMeetupAt = ctx.now;
        setMessage(tgt, 'meetup_friendly', 2500);
    }
}
