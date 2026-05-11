// src/utils/cats/tick/animation.ts
//
// Walk-frame advancement and the per-frame DOM transform writes. These run
// AFTER movement / clamp / stuck-check so they see the cat's final position
// for this frame.

import {
    RUN_CYCLE_LEN,
    RUN_PIXELS_PER_FRAME,
    WALK_CYCLE_LEN,
    WALK_PIXELS_PER_FRAME,
} from '../constants';
import type { CatState } from '../types';
import type { TickContext } from './types';

// Advance the walk frame based on travel distance. Two cycle lengths (walk
// vs run) so flee/startle look frantic.
export function updateAnimation(cat: CatState, stepDist: number): void {
    cat.distSinceFrame += stepDist;
    const isRunning = cat.run.kind === 'fleeing' || cat.run.kind === 'startled';
    const stride = isRunning ? RUN_PIXELS_PER_FRAME : WALK_PIXELS_PER_FRAME;
    const cycleLen = isRunning ? RUN_CYCLE_LEN : WALK_CYCLE_LEN;
    if (cat.distSinceFrame >= stride) {
        cat.distSinceFrame = 0;
        cat.walkFrame = (cat.walkFrame + 1) % cycleLen;
    }
}

// Write the cat's transform to its overlay div. Includes the horizontal flip
// for facing-direction, a small tilt while running, and a scale-bump while
// startled. This is the ONLY place the cat overlay's transform is written.
export function writeCatTransform(
    el: HTMLDivElement,
    cat: CatState,
    ctx: TickContext
): void {
    const isRunning = cat.run.kind === 'fleeing' || cat.run.kind === 'startled';
    const flipX = cat.facingLeft ? -1 : 1;
    const tilt = isRunning ? (cat.facingLeft ? 6 : -6) : 0;
    const scale = cat.run.kind === 'startled' ? 1.18 : 1;
    el.style.transform = `translate(${cat.x - ctx.catSize / 2}px, ${
        cat.y - ctx.catSize / 2
    }px) scale(${flipX * scale}, ${scale}) rotate(${tilt}deg)`;
}

// Speech-bubble write: clear expired messages and translate the bubble
// element to sit above the cat. Translate-only (no scale/flip) so the text
// always reads upright regardless of which way the cat is facing. The
// bubble's inner CSS handles horizontal centering via -translate-x-1/2.
export function writeBubble(
    cat: CatState,
    bubbleEl: HTMLDivElement | null,
    ctx: TickContext
): void {
    if (cat.message && ctx.now >= cat.messageUntil) {
        cat.message = null;
        cat.messageUntil = 0;
    }
    if (!bubbleEl) return;
    const bubbleY = cat.y - ctx.catSize / 2 - Math.round(ctx.catSize * 0.35);
    bubbleEl.style.transform = `translate(${cat.x}px, ${bubbleY}px)`;
}
