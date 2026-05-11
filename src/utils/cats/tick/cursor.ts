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
import { asDoc, type CatState } from '../types';
import type { TickContext } from './types';

// Phase 1: clear startled cats whose startle timer has elapsed.
export function updateStartleExpiration(cat: CatState, ctx: TickContext): void {
    if (cat.run.kind !== 'startled' || ctx.now < cat.run.startleUntil) return;
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
    cat.run = { kind: 'walking', targetX: t.x, targetY: t.y };
    cat.lastProgressAt = ctx.now;
}

// Phase 2: cursor flee/safe. Skipped while startled — startle takes precedence
// because click-startle should never be cancelled by the same click's mouse
// hover. When the cursor leaves the page entirely (`mouseDoc === null`)
// fleeing cats transition straight back to walking.
export function updateCursorFlee(cat: CatState, ctx: TickContext): void {
    if (cat.run.kind === 'startled') return;

    if (!ctx.mouseDoc) {
        if (cat.run.kind !== 'fleeing') return;
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
        cat.run = { kind: 'walking', targetX: t.x, targetY: t.y };
        cat.lastProgressAt = ctx.now;
        return;
    }

    const dxM = cat.x - ctx.mouseDoc.x;
    const dyM = cat.y - ctx.mouseDoc.y;
    const distM = Math.hypot(dxM, dyM);

    if (cat.run.kind !== 'fleeing' && distM < FLEE_RADIUS) {
        // Seed initial flee target away from the cursor. The per-frame
        // update below will keep it pointed away as the cursor moves.
        const dn = Math.max(distM, 1);
        cat.run = {
            kind: 'fleeing',
            targetX: asDoc(cat.x + (dxM / dn) * 220),
            targetY: asDoc(cat.y + (dyM / dn) * 220),
        };
        setMessage(cat, 'flee_start', 1500);
    } else if (cat.run.kind === 'fleeing' && distM > SAFE_RADIUS) {
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
        cat.run = { kind: 'walking', targetX: t.x, targetY: t.y };
        cat.lastProgressAt = ctx.now;
    }

    // Track flee target each frame while fleeing so the cat keeps running
    // directly away from the cursor.
    if (cat.run.kind === 'fleeing' && distM > 0) {
        cat.run.targetX = asDoc(cat.x + (dxM / distM) * 220);
        cat.run.targetY = asDoc(cat.y + (dyM / distM) * 220);
    }
}
