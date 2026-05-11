// src/utils/cats/tick/types.ts
//
// Per-frame context shared across every tick phase. Built once per cat by the
// orchestrator and passed to each phase function. Phases mutate the cat
// in-place and may return small values (e.g., detectCover returns inCover).

import type { CatState, DocDims, ObstacleRect } from '../types';

export interface TickContext {
    // Current frame's performance.now() timestamp. Captured ONCE per frame so
    // every phase sees the same clock — important for time-based transitions
    // that should fire at most once per frame.
    now: number;
    dims: DocDims;
    obstacles: ObstacleRect[];
    states: CatState[];
    // Index of the cat being processed; phases read this to skip self in
    // neighbor-iteration loops and to compute deterministic offsets.
    i: number;
    catSize: number;
    // Cursor position in DOCUMENT coords (clientX + scrollX, clientY + scrollY)
    // captured ONCE per frame so every cat sees the same cursor. `null` when
    // the cursor has left the document.
    mouseDoc: { x: number; y: number } | null;
}
