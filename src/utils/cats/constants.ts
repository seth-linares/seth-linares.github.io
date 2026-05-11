// src/utils/cats/constants.ts
//
// All simulation tunables in one place, grouped by subsystem. Edit here to
// change feel; nothing else needs touching. Constants are intentionally
// `export const` rather than a frozen object so tree-shaking can drop unused
// values and JIT can inline them at call sites.

import type { CatPose } from '@/types/pixel-cat';

// ── Cursor reactions ────────────────────────────────────────────────────
export const FLEE_RADIUS = 50;
export const SAFE_RADIUS = 150;
export const FLEE_SPEED = 2.0;
export const STARTLE_SPEED = 5.0;

// ── Movement speeds ─────────────────────────────────────────────────────
export const WALK_SPEED = 0.55;
// Visiting cats walk a bit faster — they have somewhere to be.
export const VISIT_SPEED = 0.85;

// ── Idle / sit timing ───────────────────────────────────────────────────
export const IDLE_MIN_MS = 2600;
export const IDLE_MAX_MS = 6500;
// Sit pose appears quickly so idle reads as "resting" rather than "frozen".
export const SIT_AFTER_MS = 450;

// ── Target selection ────────────────────────────────────────────────────
// Walk targets are picked WITHIN this radius of the cat's current position so
// transits don't span the whole document — keeps the idle/walk ratio balanced.
export const TARGET_MIN_DIST = 120;
export const TARGET_MAX_DIST = 380;

// ── Animation ───────────────────────────────────────────────────────────
export const WALK_PIXELS_PER_FRAME = 14;
export const RUN_PIXELS_PER_FRAME = 8;
// Pose tuples for the walk / run sprite cycles. `satisfies readonly CatPose[]`
// ensures every entry is a valid sprite name (renaming `walk5` in CatPose
// now causes a compile error here). The cycle lengths are derived from the
// arrays so they can never drift out of sync with the pose names.
export const WALK_POSES = [
    'walk0',
    'walk1',
    'walk2',
    'walk3',
    'walk4',
    'walk5',
] as const satisfies readonly CatPose[];
export const RUN_POSES = [
    'run0',
    'run1',
    'run2',
    'run3',
    'run4',
    'run5',
] as const satisfies readonly CatPose[];
export const WALK_CYCLE_LEN = WALK_POSES.length;
export const RUN_CYCLE_LEN = RUN_POSES.length;

// ── Click startle ───────────────────────────────────────────────────────
export const CLICK_STARTLE_RADIUS = 180;
export const STARTLE_DURATION_MS = 700;

// ── Social / meetup ─────────────────────────────────────────────────────
// Playful cats periodically scan for a friend within VISIT_RADIUS.
export const VISIT_RADIUS = 320;
// Close enough to count as "met".
export const MEETUP_DISTANCE = 56;
// Visiting cats sit beside, not on top of, their target.
export const VISIT_OFFSET = 36;
export const SOCIAL_CHECK_INTERVAL_MS = 2400;
export const MEETUP_PAUSE_MS = 1800;
// Playful cats won't pick a target whose last meetup is within this window.
// Prevents 3-cat cascade clusters where two playful cats serially visit the
// same chill/shy cat right after a meetup completes.
export const MEETUP_COOLDOWN_MS = 6000;

// ── React rendering ─────────────────────────────────────────────────────
// Throttle React re-renders for pose/message changes. The rAF loop runs at
// 60fps but React state only updates every PUSH_POSE_MS ms (~11fps).
export const PUSH_POSE_MS = 90;

// ── Cover / obstacles ───────────────────────────────────────────────────
// Cats are tracked against [data-cat-obstacle] rects. When a cat's bbox
// overlaps one it's "in cover" (rendered behind content, so visually obscured)
// — the simulation responds by multiplying speed and refusing to let it sit
// idle there.
export const OBSTACLE_SELECTOR = '[data-cat-obstacle]';
export const COVER_SPEED_MULT = 2.4;
// Navbar is fixed at top (h-16, z-50) and renders ABOVE the cat overlay, so
// cats that wander into the top NAVBAR_HEIGHT pixels are trapped invisibly
// behind it. Reserve that strip in every target picker and the per-frame clamp.
export const NAVBAR_HEIGHT = 64;
export const NAVBAR_TOP_PAD = 4;

// ── Cat-cat avoidance ───────────────────────────────────────────────────
// Target pickers refuse to place a destination within CAT_SPACING_RADIUS of
// another cat (so two cats can't independently pick the same gap), AND each
// frame's seek velocity is blended in velocity-space with an avoidance vector
// — the component of seek that points INTO a neighbor gets cancelled before
// the cat moves. That's the key behavioral fix: without it, two cats walking
// toward each other oscillate between "shove apart" and "seek back together".
//
// CAT_SPACING_RADIUS must be > MEETUP_DISTANCE so playful cats can still close
// the gap when explicitly visiting (the visiting-pair exemption disables
// avoidance between the visitor and its target).
export const CAT_SPACING_RADIUS = 80;
export const AVOID_STRENGTH = 1.2;
export const AVOID_FALLOFF_POW = 2;
export const STUCK_THRESHOLD_MS = 500;
// Facing direction is derived from delta-to-target, not this-frame motion.
// Below this delta-to-target (in pixels) the cat keeps its previous facing —
// prevents rapid scaleX flips during final-approach micro-motion and
// avoidance-cancelled seek velocity in dense clusters.
export const FACING_DEADBAND = 4;
// Idle cats don't move toward a target, so the velocity-space avoidance
// above never fires for them. Without this gentle position shove, two cats
// that go idle in overlapping positions stay perfectly stacked forever.
// Squared-falloff means very weak push at the meetup-pair distance and
// stronger near full overlap — meetup pairs drift naturally apart.
export const IDLE_SEPARATION_STRENGTH = 0.5;

// ── Simulation cap ──────────────────────────────────────────────────────
// Hard cap so a user mashing shift+click can't drown the rAF in cats.
export const MAX_CATS = 16;
