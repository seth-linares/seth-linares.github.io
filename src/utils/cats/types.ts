// src/utils/cats/types.ts
//
// Type-only module for the animated-cats simulation. Importing this file pulls
// in zero runtime code — useful for tick phases and helpers that only need to
// reference the shape of a CatState. Discriminated-union variants of
// CatRunState arrive in a later refactor commit; this file currently mirrors
// the flat union the simulation was originally written against.

import type { CatPalette, CatPose } from '@/types/pixel-cat';
import type { RefObject } from 'react';

export type CatBehavior = 'chill' | 'playful' | 'shy';

export type CatRunState = 'walking' | 'idle' | 'fleeing' | 'visiting' | 'startled';

export interface CatState {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    speed: number;
    facingLeft: boolean;
    state: CatRunState;
    behavior: CatBehavior;
    idleUntil: number;
    sitAt: number;
    distSinceFrame: number;
    walkFrame: number;
    palette: CatPalette;
    visitTarget: number | null;
    nextSocialCheck: number;
    startleUntil: number;
    // Timestamp of the last frame where the cat made meaningful forward
    // progress (stepDist > 0.1). Used by the stuck-detection safety net to
    // force a fresh target pick when avoidance + target geometry conspire to
    // leave a walking cat pinned in place for too long.
    lastProgressAt: number;
    // Timestamp of the last completed meetup. Read by the social-pick logic
    // to skip cats whose last meetup was within MEETUP_COOLDOWN_MS, so a
    // playful cat doesn't immediately re-cluster onto a freshly-met chill cat.
    // 0 means "no recent meetup".
    lastMeetupAt: number;
    // Tomodachi-style speech bubble. `message` is the current phrase (or null
    // when nothing is on screen) and `messageUntil` is the performance.now()
    // ms timestamp after which the bubble expires. Overwriting `message` IS
    // the replacement contract — a fresh event simply clobbers any prior
    // bubble. The rAF loop clears expired entries at the top of each frame.
    message: string | null;
    messageUntil: number;
}

export interface DocDims {
    width: number;
    height: number;
}

export interface ObstacleRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface UseAnimatedCatsParams {
    count: number;
    catSize: number;
}

export interface AnimatedCatsState {
    poses: CatPose[];
    palettes: CatPalette[];
    // Per-cat speech-bubble text. Same length as poses/palettes. `null` means
    // no bubble for that cat right now; the renderer hides the bubble div via
    // opacity in that case rather than unmounting, so enter/exit transitions
    // can be CSS-only.
    messages: (string | null)[];
    catRefs: RefObject<(HTMLDivElement | null)[]>;
    // Bubble overlay refs, in lockstep with catRefs. The rAF loop writes a
    // translate-only transform to each bubble element each frame — no flip,
    // so the text always reads upright regardless of the cat's facing.
    bubbleRefs: RefObject<(HTMLDivElement | null)[]>;
    enabled: boolean;
    // Current live cat count — can grow past the initial prop via the spawn button
    // or shift+click. Returned so the renderer knows how many <div>s to mount.
    count: number;
    // Maximum live cats; caller may surface this in UI (e.g., "8/16").
    maxCount: number;
    // Spawn a new cat at the given DOCUMENT coordinates. Optionally pass a palette
    // key from CAT_PALETTES so the caller can pick the coat (and the personality
    // that's keyed to it in PALETTE_BEHAVIORS). Returns false if the cap was hit.
    spawn: (docX: number, docY: number, paletteKey?: string) => boolean;
    // Remove the most-recently-added cat. Returns false if no cats remain.
    removeLast: () => boolean;
    // Replace the whole simulation with a fresh set of initial cats (palette
    // cycle + random positions). Wipes any user-spawned cats and any removals.
    reset: () => void;
    // True when activeCount matches the prop'd initial count — useful for
    // disabling the reset button when it would visibly look like a no-op.
    isAtInitialCount: boolean;
}
