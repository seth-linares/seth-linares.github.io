// src/utils/cats/factory.ts
//
// One place to build a fresh CatState. Three call sites (initial mount, reset,
// drag/shift+click spawn) used to duplicate this 20-line literal — bugs from
// adding a field in one place and forgetting another were a real risk.
//
// Two flavors: `createInitialCatState` takes everything explicit (used by
// spawn, which already knows position/palette/behavior). `spawnRandomCat`
// is the thin wrapper used by init/reset that picks position + cycles palette
// from an index.

import type { CatPalette } from '@/types/pixel-cat';
import { SOCIAL_CHECK_INTERVAL_MS, WALK_CYCLE_LEN, WALK_SPEED } from './constants';
import { behaviorForIndex, paletteForIndex } from './palette';
import { pickNearbyTarget, pickTarget } from './targets';
import type { CatBehavior, CatState, DocDims } from './types';

interface CreateCatStateInput {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    behavior: CatBehavior;
    palette: CatPalette;
}

// Build a CatState in the default `walking` state with all timing fields
// seeded against the current performance.now() clock. Use this when you've
// already picked position, target, palette, and behavior (e.g., the
// drag/shift+click spawn paths).
export function createInitialCatState(input: CreateCatStateInput): CatState {
    const now = performance.now();
    return {
        x: input.x,
        y: input.y,
        targetX: input.targetX,
        targetY: input.targetY,
        speed: WALK_SPEED * (0.75 + Math.random() * 0.5),
        facingLeft: input.targetX < input.x,
        state: 'walking',
        behavior: input.behavior,
        idleUntil: 0,
        sitAt: 0,
        distSinceFrame: 0,
        walkFrame: Math.floor(Math.random() * WALK_CYCLE_LEN),
        palette: input.palette,
        visitTarget: null,
        nextSocialCheck: now + Math.random() * SOCIAL_CHECK_INTERVAL_MS,
        startleUntil: 0,
        lastProgressAt: now,
        lastMeetupAt: 0,
        message: null,
        messageUntil: 0,
    };
}

// Pick a random doc-coord position and a nearby first target, then build a
// CatState with the index-cycled palette/behavior. Used by init and reset to
// stamp out the default eight cats.
export function spawnRandomCat(i: number, dims: DocDims, catSize: number): CatState {
    const start = pickTarget(catSize, dims);
    const target = pickNearbyTarget(catSize, start.x, start.y, dims);
    return createInitialCatState({
        x: start.x,
        y: start.y,
        targetX: target.x,
        targetY: target.y,
        behavior: behaviorForIndex(i),
        palette: paletteForIndex(i),
    });
}
