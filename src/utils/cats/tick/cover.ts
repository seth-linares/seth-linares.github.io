// src/utils/cats/tick/cover.ts
//
// Cover detection: AABB-test the cat's bbox against every cached obstacle
// rect. When in cover the cat is hidden behind content, so the simulation
// reacts by speeding the cat up (movement phase) and refusing to let it sit
// idle there (movement phase's idle branch). The check is per-frame but cheap
// (typically ~10 obstacles × 8 cats = 80 comparisons).

import type { CatState } from '../types';
import type { TickContext } from './types';

export function detectCover(cat: CatState, ctx: TickContext): boolean {
    const halfSize = ctx.catSize / 2;
    const catL = cat.x - halfSize;
    const catT = cat.y - halfSize;
    const catR = cat.x + halfSize;
    const catB = cat.y + halfSize;
    const obs = ctx.obstacles;
    for (let k = 0; k < obs.length; k++) {
        const o = obs[k];
        if (catL < o.x + o.w && catR > o.x && catT < o.y + o.h && catB > o.y) {
            return true;
        }
    }
    return false;
}
