// src/utils/cats/tick/cursor.ts
//
// Per-frame cursor / startle handling: startle expiration (back to walking
// once startleUntil has passed) and cursor flee/safe (entering flee state
// inside FLEE_RADIUS, exiting outside SAFE_RADIUS).

import { setMessage } from '../bubbles';
import {
    CAT_SPACING_RADIUS,
    FLEE_RADIUS,
    SAFE_RADIUS,
} from '../constants';
import { pickNearbyClearTarget } from '../targets';
import type { CatState } from '../types';
import type { TickContext } from './types';

// Phase 1: clear startled cats whose startle timer has elapsed.
export function updateStartleExpiration(cat: CatState, ctx: TickContext): void {
    if (cat.state !== 'startled' || ctx.now < cat.startleUntil) return;
    cat.state = 'walking';
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

// Phase 2: cursor flee/safe. Skipped while startled — startle takes precedence
// because click-startle should never be cancelled by the same click's mouse
// hover. When the cursor leaves the page entirely (`mouseDoc === null`)
// fleeing cats transition straight back to walking.
export function updateCursorFlee(cat: CatState, ctx: TickContext): void {
    if (cat.state === 'startled') return;

    if (!ctx.mouseDoc) {
        if (cat.state !== 'fleeing') return;
        cat.state = 'walking';
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
        return;
    }

    const dxM = cat.x - ctx.mouseDoc.x;
    const dyM = cat.y - ctx.mouseDoc.y;
    const distM = Math.hypot(dxM, dyM);

    if (cat.state !== 'fleeing' && distM < FLEE_RADIUS) {
        cat.state = 'fleeing';
        cat.visitTarget = null;
        setMessage(cat, 'flee_start', 1500);
    } else if (cat.state === 'fleeing' && distM > SAFE_RADIUS) {
        cat.state = 'walking';
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
    if (cat.state === 'fleeing' && distM > 0) {
        cat.targetX = cat.x + (dxM / distM) * 220;
        cat.targetY = cat.y + (dyM / distM) * 220;
    }
}
