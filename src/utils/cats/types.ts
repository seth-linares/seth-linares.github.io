// src/utils/cats/types.ts
//
// Type-only module for the animated-cats simulation. Importing this file
// pulls in zero runtime code (the toDoc/asDoc helpers ARE runtime but
// inlined to nothing after a `number → number` cast).
//
// Two TS-level guarantees this file establishes:
//   1. Discriminated union on CatRunState — each state owns its own
//      transition data. Adding a new variant (e.g. 'petting') forces every
//      `switch (cat.run.kind)` to handle it.
//   2. Branded position types — DocPos (document coords) and ViewportPos
//      (viewport / clientX-clientY coords) are nominally distinct from each
//      other and from plain `number`. The single conversion seam is
//      toDocX/toDocY which adds scrollX/Y. This prevents the "forgot to add
//      scrollX" bug at compile time.

import type { CatPalette, CatPose } from '@/types/pixel-cat';
import type { RefObject } from 'react';

// ── Coordinate brands ───────────────────────────────────────────────────
// At runtime these are just numbers; the brand is a phantom property the
// compiler tracks. `unique symbol` makes the brands nominally distinct.
export type DocPos = number & { readonly __doc: unique symbol };
export type ViewportPos = number & { readonly __vp: unique symbol };

// Conversion seams. The branded inputs/outputs make these the ONLY place
// where doc/viewport coords are explicitly mixed.
export function toDocX(v: ViewportPos): DocPos {
    return ((v as number) + window.scrollX) as DocPos;
}
export function toDocY(v: ViewportPos): DocPos {
    return ((v as number) + window.scrollY) as DocPos;
}

// Tag a raw number as a doc-coord. Use sparingly — only at trusted sources
// like target pickers and ResizeObserver measurements that produce doc coords
// by construction.
export function asDoc(v: number): DocPos {
    return v as DocPos;
}
// Tag a raw number as a viewport-coord. Use at MouseEvent boundaries where
// clientX/clientY come in.
export function asViewport(v: number): ViewportPos {
    return v as ViewportPos;
}

// ── Behavior & state machine ────────────────────────────────────────────
export type CatBehavior = 'chill' | 'playful' | 'shy';

// Discriminated union — each variant carries the state-specific data it
// needs. Common fields (position, animation, social cooldowns) live directly
// on CatState below.
export type CatRunState =
    | { kind: 'walking'; targetX: DocPos; targetY: DocPos }
    | { kind: 'idle'; idleUntil: number; sitAt: number }
    | { kind: 'fleeing'; targetX: DocPos; targetY: DocPos }
    | {
          kind: 'visiting';
          visitTarget: number;
          targetX: DocPos;
          targetY: DocPos;
      }
    | {
          kind: 'startled';
          startleUntil: number;
          targetX: DocPos;
          targetY: DocPos;
      };

export interface CatState {
    // ── Position (doc coords) + animation common to every state ─────────
    x: DocPos;
    y: DocPos;
    speed: number;
    facingLeft: boolean;
    distSinceFrame: number;
    walkFrame: number;
    behavior: CatBehavior;
    palette: CatPalette;
    // Cat's display name (e.g. "Mochi"). Picked at construction via
    // names.pickName(), stable for the life of this CatState. Surfaced via
    // AnimatedCatsState.names for future hover-tooltip code.
    name: string;
    // ── Social-system cooldowns (read across multiple states) ───────────
    nextSocialCheck: number;
    // Timestamp of the last frame where the cat made meaningful forward
    // progress (stepDist > 0.1). Used by the stuck-detection safety net.
    lastProgressAt: number;
    // Timestamp of the last completed meetup. Read by the social-pick logic
    // to skip cats whose last meetup was within MEETUP_COOLDOWN_MS.
    lastMeetupAt: number;
    // ── Speech-bubble system (common — every state can have a bubble) ───
    message: string | null;
    messageUntil: number;
    // ── State-specific via discriminated union ──────────────────────────
    run: CatRunState;
}

export interface DocDims {
    width: number;
    height: number;
}

export interface ObstacleRect {
    x: DocPos;
    y: DocPos;
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
    // no bubble for that cat right now; the renderer hides the bubble div
    // via opacity in that case rather than unmounting.
    messages: (string | null)[];
    // Per-cat display name, stable for the cat's lifetime. Future hover-info
    // UI reads names[i]. Lockstep with palettes — `spawn`/`removeLast`/
    // `reset` keep both arrays in sync.
    names: string[];
    catRefs: RefObject<(HTMLDivElement | null)[]>;
    // Bubble overlay refs, in lockstep with catRefs. The rAF loop writes a
    // translate-only transform to each bubble element each frame — no flip,
    // so the text always reads upright regardless of the cat's facing.
    bubbleRefs: RefObject<(HTMLDivElement | null)[]>;
    // Interactive overlay refs. Per-cat divs in a `z-15` overlay that
    // intercepts pointer events when feature code attaches listeners. The
    // rAF loop keeps their transforms in lockstep with catRefs so they
    // always sit over the cat's current position.
    interactiveRefs: RefObject<(HTMLDivElement | null)[]>;
    enabled: boolean;
    // Current live cat count — can grow past the initial prop via the spawn
    // button or shift+click.
    count: number;
    // Maximum live cats; caller may surface this in UI (e.g., "8/16").
    maxCount: number;
    // Spawn a new cat at the given DOCUMENT coordinates. Returns false if
    // the cap was hit.
    spawn: (docX: number, docY: number, paletteKey?: string) => boolean;
    // Remove the most-recently-added cat. Returns false if no cats remain.
    removeLast: () => boolean;
    // Replace the whole simulation with a fresh set of initial cats.
    reset: () => void;
    // True when activeCount matches the prop'd initial count — useful for
    // disabling the reset button when it would visibly look like a no-op.
    isAtInitialCount: boolean;
}
