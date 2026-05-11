// src/hooks/useAnimatedCats.ts
//
// Logic for the wandering pixel cats: simulation state, rAF loop, and cursor/click
// handlers. The component (AnimatedCats.tsx) only owns the JSX.
//
// Cats live in DOCUMENT coords, not viewport: the overlay is positioned absolutely
// over the full page, cats roam the whole document, and you scroll past them.
// Cursor proximity is computed in doc coords by adding window.scrollX/Y to
// clientX/clientY each frame.
//
// Cover handling: cats render BEHIND content (z-index negative on the overlay), so
// when they walk under a content block they're hidden from view. Elements marked
// `[data-cat-obstacle]` are tracked as obstacle rects (measured in doc coords on
// init, resize, and via a ResizeObserver on documentElement so they stay accurate
// when content reflows — e.g. the typewriter terminal growing). When a cat's bbox
// overlaps any obstacle the simulation boosts its speed (COVER_SPEED_MULT) and
// kicks it out of any idle pause so it doesn't linger out-of-sight.
//
// Personality (paired with coat color via PALETTE_BEHAVIORS):
//   chill   — wanders aimlessly, doesn't seek out other cats
//   playful — periodically picks a nearby cat and walks over to "visit"; on contact
//             both pause briefly then go their separate ways
//   shy     — startles when another cat gets too close (or when clicked nearby)
//
// Reactions:
//   cursor — flee within FLEE_RADIUS until cursor leaves SAFE_RADIUS
//   click  — clicks within CLICK_STARTLE_RADIUS startle nearby cats
//   scroll — no reaction; cats are doc-anchored so the page just slides past them

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { CAT_PALETTES, type CatPalette, type CatPose } from '@/types/pixel-cat';

type CatBehavior = 'chill' | 'playful' | 'shy';
type CatRunState = 'walking' | 'idle' | 'fleeing' | 'visiting' | 'startled';

interface CatState {
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

interface DocDims {
    width: number;
    height: number;
}

interface ObstacleRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface UseAnimatedCatsParams {
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

const FLEE_RADIUS = 50;
const SAFE_RADIUS = 150;
const FLEE_SPEED = 2.0;
const STARTLE_SPEED = 5.0;
const WALK_SPEED = 0.55;
const VISIT_SPEED = 0.85; // visiting cats walk a bit faster — they have somewhere to be
const IDLE_MIN_MS = 2600;
const IDLE_MAX_MS = 6500;
const SIT_AFTER_MS = 450; // sit pose appears quickly so idle reads as "resting"
// Walk targets are picked WITHIN this radius of the cat's current position so transits
// don't span the whole document — keeps the idle/walk ratio feeling balanced.
const TARGET_MIN_DIST = 120;
const TARGET_MAX_DIST = 380;
const WALK_PIXELS_PER_FRAME = 14;
const RUN_PIXELS_PER_FRAME = 8;
const WALK_CYCLE_LEN = 6;
const RUN_CYCLE_LEN = 6;

const CLICK_STARTLE_RADIUS = 180;
const STARTLE_DURATION_MS = 700;

// Playful cats periodically scan for a friend within VISIT_RADIUS to walk over to.
const VISIT_RADIUS = 320;
const MEETUP_DISTANCE = 56; // close enough to count as "met"
const VISIT_OFFSET = 36; // sit beside, not on top of, the other cat
const SOCIAL_CHECK_INTERVAL_MS = 2400;
const MEETUP_PAUSE_MS = 1800;

const PUSH_POSE_MS = 90; // throttle React re-renders for pose changes

// Cover handling: cats are tracked against `[data-cat-obstacle]` rects. When a
// cat's bbox overlaps one it's "in cover" (rendered behind content, so visually
// obscured) — the simulation responds by multiplying speed and forcing idle cats
// to start walking again so they don't sit hidden for long.
const OBSTACLE_SELECTOR = '[data-cat-obstacle]';
const COVER_SPEED_MULT = 2.4;
// Navbar is fixed at top (h-16, z-50) and renders ABOVE the cat overlay, so cats
// that wander into the top NAVBAR_HEIGHT pixels of the doc are invisibly trapped
// behind it. Reserve that strip in every target picker and the per-frame clamp.
const NAVBAR_HEIGHT = 64;
const NAVBAR_TOP_PAD = 4;

// Cat-cat steering: target pickers refuse to place a destination within
// CAT_SPACING_RADIUS of another cat (so two cats can't independently pick the
// same gap), AND each frame's seek velocity is blended in velocity-space with
// an avoidance vector — the component of seek that points INTO a neighbor gets
// cancelled before the cat moves. That's the key behavioral fix: previously
// the old post-hoc position shove was reactive and weaker than the next
// frame's seek, so two cats would walk into each other, get nudged apart, and
// immediately walk into each other again. With seek+avoid combined in velocity
// space they no longer fight on alternating frames.
//
// CAT_SPACING_RADIUS must be > MEETUP_DISTANCE so playful cats can still close
// the gap when explicitly visiting (the visiting-pair exemption disables
// avoidance between the visitor and its target).
const CAT_SPACING_RADIUS = 80;
const AVOID_STRENGTH = 1.2;
const AVOID_FALLOFF_POW = 2;
const STUCK_THRESHOLD_MS = 500;
// Idle cats no longer move toward a target, so the velocity-space avoidance
// above never fires for them. Without this gentle position shove, two cats
// that go idle in overlapping positions (meetup completion, simultaneous
// tray-spawn drops, or chance) stay perfectly stacked forever. Squared-falloff
// means very weak push at the meetup-pair distance and stronger near full
// overlap — meetup pairs drift naturally apart without being snapped away.
const IDLE_SEPARATION_STRENGTH = 0.5;
// Playful cats won't pick a target whose last meetup is within this window.
// Prevents 3-cat cascade clusters where two playful cats serially visit the
// same chill/shy cat right after a meetup completes.
const MEETUP_COOLDOWN_MS = 6000;

// Hard cap so a user mashing shift+click can't drown the rAF in cats.
const MAX_CATS = 16;

const PALETTE_KEYS = ['orange', 'black', 'gray', 'siamese'] as const;
// Personality is keyed by coat color so the same color is recognizably the same cat.
const PALETTE_BEHAVIORS: Record<string, CatBehavior> = {
    orange: 'chill',
    black: 'playful',
    gray: 'chill',
    siamese: 'shy',
};

// Tomodachi-style speech bubbles. Each event maps to a tiny pool of phrases;
// `setMessage` picks one at random when the corresponding state transition
// fires. Pools are deliberately short — adding/tweaking content here is the
// expected way to change the feel of the cats without touching the simulation.
type BubbleEvent =
    | 'visit_start'
    | 'meetup_friendly'
    | 'meetup_shy'
    | 'meetup_rebuffed'
    | 'flee_start'
    | 'startle'
    | 'spawned';

const BUBBLE_POOLS: Record<BubbleEvent, readonly string[]> = {
    visit_start: [
        'hi!',
        '♪',
        'wait up!',
        'hey!!',
        'wanna play?',
        'yoohoo',
        'psst',
        'scoot over',
        'incoming',
        'sup',
        'henlo',
        'guess who',
        'tag ur it',
        'boop time',
        'omw',
    ],
    meetup_friendly: [
        '♪',
        'purr',
        'hang time',
        ':)',
        '♪♪',
        'bestie',
        'we vibin',
        '<3',
        'snuggle',
        'mlem',
        'headbonk',
        'co-loafing',
        'soft hours',
        'good cat',
        'nap buddy',
        'best day',
        'two cats',
        'blep',
        'cozy',
        'paw five',
    ],
    meetup_shy: [
        'eek!',
        'no!',
        'go away',
        'yikes!',
        'back off',
        'no touchy',
        'space pls',
        'STRANGER',
        'nope nope',
    ],
    meetup_rebuffed: [
        'oh!',
        'okay…',
        'rude',
        'sheesh',
        'wow ok',
        'harsh',
        'fine.',
        'ur loss',
        'next time',
    ],
    flee_start: ['ah!', 'eep!', 'gah', 'yipe', 'scatter!', 'nope!', 'skedaddle', 'human!!'],
    startle: ['!', '!!', '!?', '?!', 'rude!', 'wha-', 'hey!!', 'spooked'],
    spawned: ['hi!', 'new cat', '♪', 'hello', 'ta-da', 'sup', 'henlo', "i'm here", 'behold'],
};

const BUBBLE_DEFAULT_MS = 2000;

function paletteForIndex(i: number): CatPalette {
    return CAT_PALETTES[PALETTE_KEYS[i % PALETTE_KEYS.length]];
}

function behaviorForIndex(i: number): CatBehavior {
    return PALETTE_BEHAVIORS[PALETTE_KEYS[i % PALETTE_KEYS.length]] ?? 'chill';
}

// Set a speech bubble on a cat. Overwriting is the replacement contract — a
// new event simply clobbers the previous bubble, including ones that haven't
// expired yet. Most state transitions in the simulation are guarded so they
// only fire once per "episode" (e.g. entering flee state, starting a visit),
// which keeps bubble flicker low without needing an explicit suppress check.
function setMessage(cat: CatState, event: BubbleEvent, durationMs = BUBBLE_DEFAULT_MS) {
    const pool = BUBBLE_POOLS[event];
    cat.message = pool[Math.floor(Math.random() * pool.length)];
    cat.messageUntil = performance.now() + durationMs;
}

function getDocDims(): DocDims {
    const docEl = document.documentElement;
    return {
        width: Math.max(docEl.scrollWidth, docEl.clientWidth, window.innerWidth),
        height: Math.max(docEl.scrollHeight, docEl.clientHeight, window.innerHeight),
    };
}

function pickTarget(catSize: number, dims: DocDims) {
    const inset = catSize + 20;
    const topInset = Math.max(inset, NAVBAR_HEIGHT + catSize / 2 + NAVBAR_TOP_PAD);
    return {
        x: inset + Math.random() * Math.max(1, dims.width - inset * 2),
        y: topInset + Math.random() * Math.max(1, dims.height - topInset - inset),
    };
}

// Pick a target near the cat's current position rather than anywhere in the doc.
// Falls back to global random if the local pick lands outside the safe area.
function pickNearbyTarget(catSize: number, fromX: number, fromY: number, dims: DocDims) {
    const inset = catSize + 20;
    const topInset = Math.max(inset, NAVBAR_HEIGHT + catSize / 2 + NAVBAR_TOP_PAD);
    const angle = Math.random() * Math.PI * 2;
    const dist = TARGET_MIN_DIST + Math.random() * (TARGET_MAX_DIST - TARGET_MIN_DIST);
    const x = fromX + Math.cos(angle) * dist;
    const y = fromY + Math.sin(angle) * dist;
    const minX = inset;
    const maxX = dims.width - inset;
    const minY = topInset;
    const maxY = dims.height - inset;
    if (x < minX || x > maxX || y < minY || y > maxY) {
        return pickTarget(catSize, dims);
    }
    return { x, y };
}

// When a cat is overlapping one or more obstacles, aim past the nearest edge of
// the overlapping set that ACTUALLY escapes after viewport clamping — so cats
// stuck near a near-full-width obstacle (like the hero text block) don't aim
// horizontally only to be clamped back inside. Considers all four edges per
// overlapping obstacle, clamps each to doc bounds, and keeps only candidates
// whose final bbox clears the cover. Returns null if the cat isn't actually
// overlapping anything OR if no valid escape exists (caller falls back to
// pickNearbyTarget).
function pickEscapeTarget(
    catX: number,
    catY: number,
    catSize: number,
    dims: DocDims,
    obstacles: ObstacleRect[]
): { x: number; y: number } | null {
    const halfSize = catSize / 2;
    const catL = catX - halfSize;
    const catT = catY - halfSize;
    const catR = catX + halfSize;
    const catB = catY + halfSize;
    const inset = catSize + 20;
    const topInset = Math.max(inset, NAVBAR_HEIGHT + halfSize + NAVBAR_TOP_PAD);
    // Just enough buffer to land outside the obstacle's bbox; tighter gaps in dense
    // layouts (e.g. between project cards) can't accommodate a wider clearance.
    const buffer = halfSize + 4;

    // Collect every obstacle the cat is currently inside.
    const covers: ObstacleRect[] = [];
    for (let k = 0; k < obstacles.length; k++) {
        const o = obstacles[k];
        if (catL < o.x + o.w && catR > o.x && catT < o.y + o.h && catB > o.y) {
            covers.push(o);
        }
    }
    if (covers.length === 0) return null;

    // Generate one candidate per (cover × edge), clamp it, then keep only those
    // that actually exit ALL current covers. Pick the shortest-move winner.
    let bestDist = Infinity;
    let bestX = 0;
    let bestY = 0;
    let foundValid = false;

    for (const o of covers) {
        const candidates = [
            { x: o.x - buffer, y: catY, d: catX - o.x }, // left
            { x: o.x + o.w + buffer, y: catY, d: o.x + o.w - catX }, // right
            { x: catX, y: o.y - buffer, d: catY - o.y }, // top
            { x: catX, y: o.y + o.h + buffer, d: o.y + o.h - catY }, // bottom
        ];
        for (const c of candidates) {
            const cx = Math.max(inset, Math.min(dims.width - inset, c.x));
            const cy = Math.max(topInset, Math.min(dims.height - inset, c.y));
            const nL = cx - halfSize;
            const nT = cy - halfSize;
            const nR = cx + halfSize;
            const nB = cy + halfSize;
            // Validate against ALL obstacles, not just the current covers — otherwise
            // a cat can hop straight from one obstacle into an adjacent one and end
            // up oscillating between escape edges.
            let lands_in_obstacle = false;
            for (let m = 0; m < obstacles.length; m++) {
                const oc = obstacles[m];
                if (nL < oc.x + oc.w && nR > oc.x && nT < oc.y + oc.h && nB > oc.y) {
                    lands_in_obstacle = true;
                    break;
                }
            }
            if (lands_in_obstacle) continue;
            if (c.d < bestDist) {
                bestDist = c.d;
                bestX = cx;
                bestY = cy;
                foundValid = true;
            }
        }
    }

    if (!foundValid) return null;
    return { x: bestX, y: bestY };
}

function rectContainsBbox(
    x: number,
    y: number,
    halfSize: number,
    obstacles: ObstacleRect[]
): boolean {
    const L = x - halfSize;
    const T = y - halfSize;
    const R = x + halfSize;
    const B = y + halfSize;
    for (let k = 0; k < obstacles.length; k++) {
        const o = obstacles[k];
        if (L < o.x + o.w && R > o.x && T < o.y + o.h && B > o.y) return true;
    }
    return false;
}

// Sample a few intermediate points along the straight-line path from→to and
// return true if every point's bbox is in clear space. Used to avoid picking
// targets whose path would dive through cover unnecessarily.
function pathIsClear(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    catSize: number,
    obstacles: ObstacleRect[]
): boolean {
    const halfSize = catSize / 2;
    const SAMPLES = 6;
    for (let i = 1; i <= SAMPLES; i++) {
        const t = i / SAMPLES;
        const x = fromX + (toX - fromX) * t;
        const y = fromY + (toY - fromY) * t;
        if (rectContainsBbox(x, y, halfSize, obstacles)) return false;
    }
    return true;
}

// True when (x, y) is within `radius` of any other cat in `states`, treating
// (x, y) as the new candidate position for `states[selfIdx]`. The visiting
// pair is exempt — if selfIdx is visiting j (or j is visiting selfIdx), they
// must be allowed to close to MEETUP_DISTANCE; otherwise CAT_SPACING_RADIUS
// would smother the meetup behavior. Distance-squared compared against
// radius² to avoid a per-call sqrt.
function tooCloseToOtherCat(
    x: number,
    y: number,
    selfIdx: number,
    states: CatState[],
    radius: number
): boolean {
    const radiusSq = radius * radius;
    const self = states[selfIdx];
    for (let j = 0; j < states.length; j++) {
        if (j === selfIdx) continue;
        const other = states[j];
        // Skip the partner of an active visit so visitors can still arrive.
        if (self && self.visitTarget === j) continue;
        if (other.visitTarget === selfIdx) continue;
        const dx = x - other.x;
        const dy = y - other.y;
        if (dx * dx + dy * dy < radiusSq) return true;
    }
    return false;
}

// Random doc-coord target that's also not inside any obstacle. When `states`
// is provided, also rejects targets within `spacing` of another cat (modulo
// the visiting-pair exemption in tooCloseToOtherCat). Falls back to a plain
// random target after enough failed attempts so the simulation never stalls.
function pickClearTarget(
    catSize: number,
    dims: DocDims,
    obstacles: ObstacleRect[],
    states?: CatState[],
    selfIdx?: number,
    spacing?: number,
    attempts = 12
): { x: number; y: number } {
    const halfSize = catSize / 2;
    for (let i = 0; i < attempts; i++) {
        const t = pickTarget(catSize, dims);
        if (rectContainsBbox(t.x, t.y, halfSize, obstacles)) continue;
        if (
            states !== undefined &&
            selfIdx !== undefined &&
            spacing !== undefined &&
            tooCloseToOtherCat(t.x, t.y, selfIdx, states, spacing)
        ) {
            continue;
        }
        return t;
    }
    return pickTarget(catSize, dims);
}

// Cat is currently standing in a gap; pick a NEARBY target that's also in a gap
// AND reachable via a straight-line path that stays in clear space. When
// `states` is provided, also rejects targets within `spacing` of another cat
// so two cats can't independently pick the same destination. Falls through to
// plain pickNearbyTarget if no clear nearby pick is found within the budget.
function pickNearbyClearTarget(
    catSize: number,
    fromX: number,
    fromY: number,
    dims: DocDims,
    obstacles: ObstacleRect[],
    states?: CatState[],
    selfIdx?: number,
    spacing?: number,
    attempts = 10
): { x: number; y: number } {
    const halfSize = catSize / 2;
    for (let i = 0; i < attempts; i++) {
        const t = pickNearbyTarget(catSize, fromX, fromY, dims);
        if (rectContainsBbox(t.x, t.y, halfSize, obstacles)) continue;
        if (!pathIsClear(fromX, fromY, t.x, t.y, catSize, obstacles)) continue;
        if (
            states !== undefined &&
            selfIdx !== undefined &&
            spacing !== undefined &&
            tooCloseToOtherCat(t.x, t.y, selfIdx, states, spacing)
        ) {
            continue;
        }
        return t;
    }
    return pickNearbyTarget(catSize, fromX, fromY, dims);
}

export function useAnimatedCats({ count, catSize }: UseAnimatedCatsParams): AnimatedCatsState {
    const catRefs = useRef<(HTMLDivElement | null)[]>([]);
    const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
    const statesRef = useRef<CatState[]>([]);
    const mouseRef = useRef<{ vx: number; vy: number } | null>(null);
    const docDimsRef = useRef<DocDims>({ width: 0, height: 0 });
    const obstaclesRef = useRef<ObstacleRect[]>([]);
    const rafRef = useRef<number | null>(null);
    // activeCount grows past the initial `count` prop via shift+click spawns. The
    // rAF tick reads from statesRef.current.length directly, so this state exists
    // mostly to drive React re-renders (so new <div> elements get mounted for the
    // newly-pushed cats).
    const [activeCount, setActiveCount] = useState(count);
    const [poses, setPoses] = useState<CatPose[]>(() => Array(count).fill('idle'));
    // Per-cat speech-bubble text. Pushed at the same throttled cadence as
    // poses (PUSH_POSE_MS) — see the tick body for the equality-checked push.
    const [messages, setMessages] = useState<(string | null)[]>(() => Array(count).fill(null));
    const [enabled, setEnabled] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setEnabled(!mq.matches);
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    // palettes is React state (not a useMemo of activeCount) so each cat's actual
    // palette — including user-picked coats from the tray — drives what gets
    // rendered. The previous index-derived useMemo only happened to match for the
    // initial cats; user-spawned cats with custom palettes ended up rendering as
    // whatever `paletteForIndex(spawnIndex)` returned.
    const [palettes, setPalettes] = useState<CatPalette[]>(() =>
        Array.from({ length: count }, (_, i) => paletteForIndex(i))
    );

    // Imperative spawn API used by both the in-effect shift+click handler AND the
    // drag-to-place tray in <AnimatedCats>. Pushes directly into statesRef.current
    // (so the rAF picks it up next tick) and bumps activeCount so React mounts a new
    // <div> for the cat. The optional `paletteKey` lets the caller pick the cat's
    // coat color (and therefore its personality via PALETTE_BEHAVIORS); omit it to
    // get the index-cycled default. Returns false at the cap so the UI can disable.
    const spawn = useCallback(
        (docX: number, docY: number, paletteKey?: string): boolean => {
            const states = statesRef.current;
            if (states.length >= MAX_CATS) return false;
            const idx = states.length;
            const palette = paletteKey
                ? (CAT_PALETTES[paletteKey] ?? paletteForIndex(idx))
                : paletteForIndex(idx);
            const behavior = paletteKey
                ? (PALETTE_BEHAVIORS[paletteKey] ?? 'chill')
                : behaviorForIndex(idx);
            // idx === states.length is the index this cat will occupy after the
            // push below — pass it to the cat-aware picker so the new cat's
            // first target dodges existing cats.
            const target = pickNearbyClearTarget(
                catSize,
                docX,
                docY,
                docDimsRef.current,
                obstaclesRef.current,
                states,
                idx,
                CAT_SPACING_RADIUS
            );
            states.push({
                x: docX,
                y: docY,
                targetX: target.x,
                targetY: target.y,
                speed: WALK_SPEED * (0.75 + Math.random() * 0.5),
                facingLeft: target.x < docX,
                state: 'walking',
                behavior,
                idleUntil: 0,
                sitAt: 0,
                distSinceFrame: 0,
                walkFrame: Math.floor(Math.random() * WALK_CYCLE_LEN),
                palette,
                visitTarget: null,
                nextSocialCheck:
                    performance.now() + Math.random() * SOCIAL_CHECK_INTERVAL_MS,
                startleUntil: 0,
                lastProgressAt: performance.now(),
                lastMeetupAt: 0,
                message: null,
                messageUntil: 0,
            });
            // Greet on spawn — both shift+click and the drag tray route here.
            setMessage(states[idx], 'spawned');
            setActiveCount(states.length);
            setPalettes((prev) => [...prev, palette]);
            setMessages((prev) => [...prev, states[idx].message]);
            return true;
        },
        [catSize]
    );

    // Remove the most-recently-added cat. Pops from statesRef and drops the last
    // palette so the React renderer (which reads palettes[i]) shrinks in lockstep.
    const removeLast = useCallback((): boolean => {
        const states = statesRef.current;
        if (states.length === 0) return false;
        states.pop();
        setActiveCount(states.length);
        setPalettes((prev) => prev.slice(0, -1));
        setMessages((prev) => prev.slice(0, -1));
        return true;
    }, []);

    // Replace the simulation with a fresh batch of initial cats. Wipes any user
    // spawns and any prior removals; cats jump to new random positions since
    // there's no meaningful way to preserve identity here.
    const reset = useCallback(() => {
        statesRef.current = Array.from({ length: count }, (_, i) => {
            const start = pickTarget(catSize, docDimsRef.current);
            const target = pickNearbyTarget(
                catSize,
                start.x,
                start.y,
                docDimsRef.current
            );
            return {
                x: start.x,
                y: start.y,
                targetX: target.x,
                targetY: target.y,
                speed: WALK_SPEED * (0.75 + Math.random() * 0.5),
                facingLeft: target.x < start.x,
                state: 'walking' as const,
                behavior: behaviorForIndex(i),
                idleUntil: 0,
                sitAt: 0,
                distSinceFrame: 0,
                walkFrame: Math.floor(Math.random() * WALK_CYCLE_LEN),
                palette: paletteForIndex(i),
                visitTarget: null,
                nextSocialCheck:
                    performance.now() + Math.random() * SOCIAL_CHECK_INTERVAL_MS,
                startleUntil: 0,
                lastProgressAt: performance.now(),
                lastMeetupAt: 0,
                message: null,
                messageUntil: 0,
            };
        });
        setActiveCount(count);
        setPalettes(
            Array.from({ length: count }, (_, i) => paletteForIndex(i))
        );
        setMessages(Array(count).fill(null));
    }, [count, catSize]);

    useEffect(() => {
        if (typeof window === 'undefined' || !enabled) return;

        docDimsRef.current = getDocDims();

        // Measure the doc-coord rects of every `[data-cat-obstacle]` element. Stored
        // in doc coords (rect + scrollX/Y at measure time) so the cache stays valid
        // across scroll without per-frame remeasurement.
        const measureObstacles = () => {
            const els = document.querySelectorAll<HTMLElement>(OBSTACLE_SELECTOR);
            const sx = window.scrollX;
            const sy = window.scrollY;
            const rects: ObstacleRect[] = [];
            els.forEach((el) => {
                const r = el.getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0) return;
                rects.push({
                    x: r.left + sx,
                    y: r.top + sy,
                    w: r.width,
                    h: r.height,
                });
            });
            obstaclesRef.current = rects;
        };
        measureObstacles();

        // Only initialize the initial set of cats once. Subsequent re-runs of this
        // effect (e.g. enabled toggling) reuse the existing simulation state, and
        // shift+click spawns push directly into statesRef.current without going
        // through this init path.
        if (statesRef.current.length === 0) {
            statesRef.current = Array.from({ length: count }, (_, i) => {
                const start = pickTarget(catSize, docDimsRef.current);
                // Initial target is nearby so cats don't beeline across the whole
                // doc on first wake — they settle into local roaming and drift
                // over time.
                const target = pickNearbyTarget(catSize, start.x, start.y, docDimsRef.current);
                return {
                    x: start.x,
                    y: start.y,
                    targetX: target.x,
                    targetY: target.y,
                    speed: WALK_SPEED * (0.75 + Math.random() * 0.5),
                    facingLeft: target.x < start.x,
                    state: 'walking' as const,
                    behavior: behaviorForIndex(i),
                    idleUntil: 0,
                    sitAt: 0,
                    distSinceFrame: 0,
                    walkFrame: Math.floor(Math.random() * WALK_CYCLE_LEN),
                    palette: paletteForIndex(i),
                    visitTarget: null,
                    nextSocialCheck:
                        performance.now() + Math.random() * SOCIAL_CHECK_INTERVAL_MS,
                    startleUntil: 0,
                    lastProgressAt: performance.now(),
                    lastMeetupAt: 0,
                    message: null,
                    messageUntil: 0,
                };
            });
        }

        // Throttle remeasures to one per frame; ResizeObserver can fire repeatedly
        // during the typewriter effect (terminal box growing each character).
        let measurePending = false;
        const queueMeasure = () => {
            if (measurePending) return;
            measurePending = true;
            requestAnimationFrame(() => {
                measurePending = false;
                measureObstacles();
            });
        };

        const resizeObs = new ResizeObserver(queueMeasure);
        resizeObs.observe(document.documentElement);

        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current = { vx: e.clientX, vy: e.clientY };
        };
        const onMouseLeave = () => {
            mouseRef.current = null;
        };
        const onClick = (e: MouseEvent) => {
            const cx = e.clientX + window.scrollX;
            const cy = e.clientY + window.scrollY;

            // Shift+click = power-user shortcut for the same spawn path that the
            // floating button drives. Skips the startle below.
            if (e.shiftKey) {
                spawn(cx, cy);
                return;
            }

            const states = statesRef.current;
            const now = performance.now();
            for (const cat of states) {
                if (cat.state === 'startled' || cat.state === 'fleeing') continue;
                const d = Math.hypot(cat.x - cx, cat.y - cy);
                if (d < CLICK_STARTLE_RADIUS) {
                    cat.state = 'startled';
                    cat.startleUntil = now + STARTLE_DURATION_MS;
                    cat.visitTarget = null;
                    const norm = Math.max(d, 1);
                    cat.targetX = cat.x + ((cat.x - cx) / norm) * 220;
                    cat.targetY = cat.y + ((cat.y - cy) / norm) * 220;
                    cat.facingLeft = cat.x < cx;
                    cat.distSinceFrame = 0;
                    setMessage(cat, 'startle', 1500);
                }
            }
        };
        const onResize = () => {
            // Re-measure the doc, then clamp every cat into the new bounds and nudge
            // idle cats toward a fresh target so they don't sit visibly off-doc.
            docDimsRef.current = getDocDims();
            measureObstacles();
            const dims = docDimsRef.current;
            const inset = catSize / 2;
            const topClamp = NAVBAR_HEIGHT + inset + NAVBAR_TOP_PAD;
            for (const cat of statesRef.current) {
                cat.x = Math.max(inset, Math.min(dims.width - inset, cat.x));
                cat.y = Math.max(topClamp, Math.min(dims.height - inset, cat.y));
                if (cat.state === 'idle' || cat.state === 'walking') {
                    const t = pickNearbyTarget(catSize, cat.x, cat.y, dims);
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                    if (cat.state === 'idle') {
                        cat.state = 'walking';
                        cat.sitAt = 0;
                    }
                }
            }
        };
        window.addEventListener('mousemove', onMouseMove);
        document.documentElement.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('click', onClick);
        window.addEventListener('resize', onResize);

        let lastPosesPushed = 0;

        const tick = () => {
            const now = performance.now();
            const states = statesRef.current;
            const dims = docDimsRef.current;

            for (let i = 0; i < states.length; i++) {
                const cat = states[i];
                const el = catRefs.current[i];
                if (!el) continue;

                // 1. Startle expiration → resume normal walking.
                if (cat.state === 'startled' && now >= cat.startleUntil) {
                    cat.state = 'walking';
                    const t = pickNearbyClearTarget(
                        catSize,
                        cat.x,
                        cat.y,
                        dims,
                        obstaclesRef.current,
                        states,
                        i,
                        CAT_SPACING_RADIUS
                    );
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                    cat.lastProgressAt = now;
                }

                // 2. Cursor flee/safe (skipped while startled — startle takes precedence).
                if (cat.state !== 'startled' && mouseRef.current) {
                    const mx = mouseRef.current.vx + window.scrollX;
                    const my = mouseRef.current.vy + window.scrollY;
                    const dxM = cat.x - mx;
                    const dyM = cat.y - my;
                    const distM = Math.hypot(dxM, dyM);
                    if (cat.state !== 'fleeing' && distM < FLEE_RADIUS) {
                        cat.state = 'fleeing';
                        cat.visitTarget = null;
                        setMessage(cat, 'flee_start', 1500);
                    } else if (cat.state === 'fleeing' && distM > SAFE_RADIUS) {
                        cat.state = 'walking';
                        const t = pickNearbyClearTarget(
                            catSize,
                            cat.x,
                            cat.y,
                            dims,
                            obstaclesRef.current,
                            states,
                            i,
                            CAT_SPACING_RADIUS
                        );
                        cat.targetX = t.x;
                        cat.targetY = t.y;
                        cat.lastProgressAt = now;
                    }
                    if (cat.state === 'fleeing' && distM > 0) {
                        cat.targetX = cat.x + (dxM / distM) * 220;
                        cat.targetY = cat.y + (dyM / distM) * 220;
                    }
                } else if (cat.state === 'fleeing' && !mouseRef.current) {
                    cat.state = 'walking';
                    const t = pickNearbyClearTarget(
                        catSize,
                        cat.x,
                        cat.y,
                        dims,
                        obstaclesRef.current,
                        states,
                        i,
                        CAT_SPACING_RADIUS
                    );
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                    cat.lastProgressAt = now;
                }

                // 3. Social: playful cats may decide to visit a nearby cat.
                // Cooldowns prevent two filter-failures that caused visible
                // cluster cascades:
                //   - skip cats that just finished a meetup (lastMeetupAt)
                //     so a freshly-met chill cat isn't immediately re-targeted
                //     by another playful cat,
                //   - skip cats that are currently the target of someone else's
                //     active visit so two playful cats don't converge on the
                //     same chill cat simultaneously.
                if (
                    cat.behavior === 'playful' &&
                    (cat.state === 'walking' || cat.state === 'idle') &&
                    now >= cat.nextSocialCheck
                ) {
                    cat.nextSocialCheck = now + SOCIAL_CHECK_INTERVAL_MS;
                    // The cat just considered a visit and its own recent meetup
                    // also makes it a poor visitor — skip the search entirely
                    // when on cooldown. The pause is shorter than the cooldown
                    // so the cat will be back to walking before it tries again.
                    if (now - cat.lastMeetupAt >= MEETUP_COOLDOWN_MS) {
                        let nearestIdx = -1;
                        let nearestDist = VISIT_RADIUS;
                        for (let j = 0; j < states.length; j++) {
                            if (j === i) continue;
                            const other = states[j];
                            if (other.state === 'fleeing' || other.state === 'startled') {
                                continue;
                            }
                            if (now - other.lastMeetupAt < MEETUP_COOLDOWN_MS) continue;
                            // Skip if another cat is already visiting this one.
                            let alreadyTargeted = false;
                            for (let k = 0; k < states.length; k++) {
                                if (k === i || k === j) continue;
                                if (states[k].visitTarget === j) {
                                    alreadyTargeted = true;
                                    break;
                                }
                            }
                            if (alreadyTargeted) continue;
                            const d = Math.hypot(other.x - cat.x, other.y - cat.y);
                            if (d > MEETUP_DISTANCE && d < nearestDist) {
                                nearestIdx = j;
                                nearestDist = d;
                            }
                        }
                        if (nearestIdx >= 0) {
                            cat.state = 'visiting';
                            cat.visitTarget = nearestIdx;
                            cat.idleUntil = 0;
                            setMessage(cat, 'visit_start');
                        }
                    }
                }

                // 4. Track visit target.
                if (cat.state === 'visiting' && cat.visitTarget !== null) {
                    const tgt = states[cat.visitTarget];
                    if (tgt.state === 'fleeing' || tgt.state === 'startled') {
                        cat.state = 'walking';
                        cat.visitTarget = null;
                        const p = pickNearbyTarget(catSize, cat.x, cat.y, dims);
                        cat.targetX = p.x;
                        cat.targetY = p.y;
                    } else {
                        const dxv = tgt.x - cat.x;
                        const dyv = tgt.y - cat.y;
                        const distv = Math.hypot(dxv, dyv);
                        if (distv < MEETUP_DISTANCE) {
                            if (tgt.behavior === 'shy') {
                                tgt.state = 'startled';
                                tgt.startleUntil = now + STARTLE_DURATION_MS;
                                const dn = Math.max(distv, 1);
                                tgt.targetX = tgt.x + (-dxv / dn) * 220;
                                tgt.targetY = tgt.y + (-dyv / dn) * 220;
                                tgt.facingLeft = -dxv < 0;
                                tgt.visitTarget = null;
                                setMessage(tgt, 'meetup_shy', 1500);
                                cat.state = 'walking';
                                cat.visitTarget = null;
                                setMessage(cat, 'meetup_rebuffed');
                                const p = pickNearbyTarget(catSize, cat.x, cat.y, dims);
                                cat.targetX = p.x;
                                cat.targetY = p.y;
                            } else {
                                cat.state = 'idle';
                                cat.idleUntil = now + MEETUP_PAUSE_MS + Math.random() * 1500;
                                cat.sitAt = now + 600;
                                cat.visitTarget = null;
                                cat.lastMeetupAt = now;
                                setMessage(cat, 'meetup_friendly', 2500);
                                if (tgt.state === 'walking' || tgt.state === 'idle') {
                                    tgt.state = 'idle';
                                    tgt.idleUntil = Math.max(tgt.idleUntil, now + MEETUP_PAUSE_MS);
                                    tgt.sitAt = now + 600;
                                    tgt.lastMeetupAt = now;
                                    setMessage(tgt, 'meetup_friendly', 2500);
                                }
                            }
                        } else {
                            const offsetSign = i % 2 === 0 ? 1 : -1;
                            cat.targetX = tgt.x + offsetSign * VISIT_OFFSET;
                            cat.targetY = tgt.y;
                        }
                    }
                }

                // 5. Cover detection: AABB-test the cat's bbox against every cached
                // obstacle rect. When in cover the cat is hidden behind content, so
                // the simulation reacts by speeding the cat up and refusing to let
                // it sit idle there. The check is per-frame but cheap (typically
                // ~10 obstacles × 8 cats = 80 comparisons).
                const halfSize = catSize / 2;
                const catL = cat.x - halfSize;
                const catT = cat.y - halfSize;
                const catR = cat.x + halfSize;
                const catB = cat.y + halfSize;
                const obs = obstaclesRef.current;
                let inCover = false;
                for (let k = 0; k < obs.length; k++) {
                    const o = obs[k];
                    if (catL < o.x + o.w && catR > o.x && catT < o.y + o.h && catB > o.y) {
                        inCover = true;
                        break;
                    }
                }

                // 6. Move toward current target (or expire idle).
                let stepX = 0;
                let stepY = 0;

                if (cat.state === 'idle') {
                    // If cover finds the cat sitting hidden, abandon the rest of the
                    // idle window and start walking. Try the nearest cover edge
                    // first; fall back to a far-off clear spot when no local escape
                    // exists (e.g. center of a near-full-width obstacle). When
                    // already visible, prefer a nearby target that ALSO stays in
                    // clear space — keeps roaming cats inside their current gap
                    // instead of walking straight back into cover.
                    if (inCover || now >= cat.idleUntil) {
                        cat.state = 'walking';
                        cat.sitAt = 0;
                        let t: { x: number; y: number };
                        if (inCover) {
                            // Escape edge picker is geometry-only (no cat awareness)
                            // — getting out of cover takes priority over respecting
                            // cat spacing. The clear-target fallback DOES respect
                            // spacing so we don't pop out next to another cat.
                            t =
                                pickEscapeTarget(cat.x, cat.y, catSize, dims, obs) ??
                                pickClearTarget(
                                    catSize,
                                    dims,
                                    obs,
                                    states,
                                    i,
                                    CAT_SPACING_RADIUS
                                );
                        } else {
                            t = pickNearbyClearTarget(
                                catSize,
                                cat.x,
                                cat.y,
                                dims,
                                obs,
                                states,
                                i,
                                CAT_SPACING_RADIUS
                            );
                        }
                        cat.targetX = t.x;
                        cat.targetY = t.y;
                        cat.lastProgressAt = now;
                    } else {
                        // Idle but not waking up yet. Velocity-space avoidance
                        // only runs in the seek branch below (which is skipped
                        // for idle cats), so without this pass two cats that
                        // go idle in overlapping positions — meetup cascade,
                        // simultaneous tray-spawn drops, or random init — stay
                        // perfectly stacked forever. Squared falloff over the
                        // full CAT_SPACING_RADIUS gives a near-zero push at
                        // 60+px and a meaningful push only as overlap grows,
                        // so meetup pairs at ~36px drift apart gently while
                        // truly stacked cats separate faster. Visit-pair
                        // exemption is symmetric with the walking-state one
                        // so an in-progress visit isn't shoved off course.
                        const radiusSq = CAT_SPACING_RADIUS * CAT_SPACING_RADIUS;
                        let pushX = 0;
                        let pushY = 0;
                        for (let j = 0; j < states.length; j++) {
                            if (j === i) continue;
                            const other = states[j];
                            if (cat.visitTarget === j) continue;
                            if (other.visitTarget === i) continue;
                            const dxN = cat.x - other.x;
                            const dyN = cat.y - other.y;
                            const distSq = dxN * dxN + dyN * dyN;
                            if (distSq >= radiusSq || distSq === 0) continue;
                            const distN = Math.sqrt(distSq);
                            const falloff =
                                (1 - distN / CAT_SPACING_RADIUS) ** AVOID_FALLOFF_POW;
                            pushX += (dxN / distN) * falloff;
                            pushY += (dyN / distN) * falloff;
                        }
                        cat.x += pushX * IDLE_SEPARATION_STRENGTH;
                        cat.y += pushY * IDLE_SEPARATION_STRENGTH;
                    }
                } else {
                    const dx = cat.targetX - cat.x;
                    const dy = cat.targetY - cat.y;
                    const dist = Math.hypot(dx, dy);
                    let speed = cat.speed;
                    if (cat.state === 'fleeing') speed = FLEE_SPEED;
                    else if (cat.state === 'startled') speed = STARTLE_SPEED;
                    else if (cat.state === 'visiting') speed = VISIT_SPEED;
                    // Cover boost: cats out of sight should pop back into view fast.
                    // Don't compound onto already-frantic states (flee/startle).
                    if (
                        inCover &&
                        cat.state !== 'fleeing' &&
                        cat.state !== 'startled'
                    ) {
                        speed *= COVER_SPEED_MULT;
                    }
                    if (dist < speed) {
                        // Arrived-but-blocked guard: if landing on this target
                        // would put the cat on another cat, repick instead of
                        // snapping/sitting on top of someone. Only fires for
                        // ordinary walking — visiting cats are SUPPOSED to land
                        // next to their partner, and in-cover cats have their
                        // own escape logic that doesn't go through idle anyway.
                        const arrivedBlocked =
                            cat.state === 'walking' &&
                            !inCover &&
                            tooCloseToOtherCat(
                                cat.targetX,
                                cat.targetY,
                                i,
                                states,
                                MEETUP_DISTANCE
                            );
                        if (arrivedBlocked) {
                            const t = pickNearbyClearTarget(
                                catSize,
                                cat.x,
                                cat.y,
                                dims,
                                obs,
                                states,
                                i,
                                CAT_SPACING_RADIUS
                            );
                            cat.targetX = t.x;
                            cat.targetY = t.y;
                            cat.lastProgressAt = now;
                        } else {
                            cat.x = cat.targetX;
                            cat.y = cat.targetY;
                            if (cat.state === 'walking') {
                                if (inCover) {
                                    // Reached the destination but still hidden —
                                    // keep walking, aimed at the nearest exit edge
                                    // or a far-off clear spot if no edge escape
                                    // works.
                                    const t =
                                        pickEscapeTarget(
                                            cat.x,
                                            cat.y,
                                            catSize,
                                            dims,
                                            obs
                                        ) ??
                                        pickClearTarget(
                                            catSize,
                                            dims,
                                            obs,
                                            states,
                                            i,
                                            CAT_SPACING_RADIUS
                                        );
                                    cat.targetX = t.x;
                                    cat.targetY = t.y;
                                    cat.lastProgressAt = now;
                                } else {
                                    cat.state = 'idle';
                                    cat.idleUntil =
                                        now +
                                        IDLE_MIN_MS +
                                        Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
                                    cat.sitAt = now + SIT_AFTER_MS;
                                }
                            }
                        }
                    } else {
                        // Seek velocity (toward target).
                        let seekX = (dx / dist) * speed;
                        let seekY = (dy / dist) * speed;

                        // Cat-cat avoidance combined with seek in VELOCITY SPACE.
                        // Old code added a post-hoc position shove AFTER moving
                        // toward the target, which the target attraction would
                        // immediately undo the next frame — that's what caused
                        // the "keep retrying to go into one another" oscillation.
                        // Here we:
                        //   1) compute the avoidance push from neighbors,
                        //   2) project seek onto the avoid direction and CANCEL
                        //      the component pointing INTO the cluster, so the
                        //      target attraction can no longer fight avoidance,
                        //   3) add the avoid push, then clamp to max speed.
                        // Visiting cats and frantic states bypass this so meetups
                        // and flee/startle motion are unaffected.
                        if (
                            cat.state !== 'visiting' &&
                            cat.state !== 'fleeing' &&
                            cat.state !== 'startled'
                        ) {
                            const radiusSq =
                                CAT_SPACING_RADIUS * CAT_SPACING_RADIUS;
                            let avoidX = 0;
                            let avoidY = 0;
                            for (let j = 0; j < states.length; j++) {
                                if (j === i) continue;
                                const other = states[j];
                                // Visiting pair exemption — symmetric, mirrors
                                // tooCloseToOtherCat — so playful cats can still
                                // close to MEETUP_DISTANCE for a successful visit.
                                if (cat.visitTarget === j) continue;
                                if (other.visitTarget === i) continue;
                                const dxN = cat.x - other.x;
                                const dyN = cat.y - other.y;
                                const distSq = dxN * dxN + dyN * dyN;
                                if (distSq >= radiusSq || distSq === 0) continue;
                                const distN = Math.sqrt(distSq);
                                const falloff =
                                    (1 - distN / CAT_SPACING_RADIUS) **
                                    AVOID_FALLOFF_POW;
                                avoidX += (dxN / distN) * falloff;
                                avoidY += (dyN / distN) * falloff;
                            }
                            const avoidLen = Math.hypot(avoidX, avoidY);
                            if (avoidLen > 0) {
                                const avoidUX = avoidX / avoidLen;
                                const avoidUY = avoidY / avoidLen;
                                // seek · avoidUnit > 0 => seek already aligned
                                // with avoid (moving away from neighbors). < 0 =>
                                // seek points INTO the cluster; remove that
                                // component.
                                const seekProj = seekX * avoidUX + seekY * avoidUY;
                                if (seekProj < 0) {
                                    seekX -= seekProj * avoidUX;
                                    seekY -= seekProj * avoidUY;
                                }
                                seekX += avoidX * AVOID_STRENGTH;
                                seekY += avoidY * AVOID_STRENGTH;
                            }
                        }

                        // Clamp final step to the cat's max speed for this frame.
                        const stepLen = Math.hypot(seekX, seekY);
                        if (stepLen > speed && stepLen > 0) {
                            seekX = (seekX / stepLen) * speed;
                            seekY = (seekY / stepLen) * speed;
                        }
                        stepX = seekX;
                        stepY = seekY;
                        cat.x += stepX;
                        cat.y += stepY;
                        if (Math.abs(stepX) > 0.05) cat.facingLeft = stepX < 0;
                    }
                }

                const inset = catSize / 2;
                const topClamp = NAVBAR_HEIGHT + inset + NAVBAR_TOP_PAD;
                cat.x = Math.max(inset, Math.min(dims.width - inset, cat.x));
                cat.y = Math.max(topClamp, Math.min(dims.height - inset, cat.y));

                const stepDist = Math.hypot(stepX, stepY);

                // Stuck-detection safety net. Avoidance can briefly cancel seek
                // velocity in tight clusters; if a walking cat keeps making no
                // progress for STUCK_THRESHOLD_MS we force a fresh target. Idle
                // / visiting / flee / startle don't have this problem because
                // they either don't have a walk target or bypass avoidance.
                if (stepDist > 0.1) {
                    cat.lastProgressAt = now;
                } else if (
                    cat.state === 'walking' &&
                    now - cat.lastProgressAt > STUCK_THRESHOLD_MS
                ) {
                    const t = pickNearbyClearTarget(
                        catSize,
                        cat.x,
                        cat.y,
                        dims,
                        obs,
                        states,
                        i,
                        CAT_SPACING_RADIUS
                    );
                    cat.targetX = t.x;
                    cat.targetY = t.y;
                    cat.lastProgressAt = now;
                }

                cat.distSinceFrame += stepDist;
                const isRunning = cat.state === 'fleeing' || cat.state === 'startled';
                const stride = isRunning ? RUN_PIXELS_PER_FRAME : WALK_PIXELS_PER_FRAME;
                const cycleLen = isRunning ? RUN_CYCLE_LEN : WALK_CYCLE_LEN;
                if (cat.distSinceFrame >= stride) {
                    cat.distSinceFrame = 0;
                    cat.walkFrame = (cat.walkFrame + 1) % cycleLen;
                }

                const flipX = cat.facingLeft ? -1 : 1;
                const tilt = isRunning ? (cat.facingLeft ? 6 : -6) : 0;
                const scale = cat.state === 'startled' ? 1.18 : 1;
                el.style.transform = `translate(${cat.x - catSize / 2}px, ${
                    cat.y - catSize / 2
                }px) scale(${flipX * scale}, ${scale}) rotate(${tilt}deg)`;

                // Speech bubble: clear expired messages, then translate the
                // bubble element to sit above the cat. Translate-only (no
                // scale/flip) so text always reads upright. The bubble's own
                // CSS handles horizontal centering via -translate-x-1/2.
                if (cat.message && now >= cat.messageUntil) {
                    cat.message = null;
                    cat.messageUntil = 0;
                }
                const bubbleEl = bubbleRefs.current[i];
                if (bubbleEl) {
                    const bubbleY = cat.y - catSize / 2 - Math.round(catSize * 0.35);
                    bubbleEl.style.transform = `translate(${cat.x}px, ${bubbleY}px)`;
                }
            }

            // Compute next poses and push to React if changed (throttled).
            if (now - lastPosesPushed >= PUSH_POSE_MS) {
                const nextPoses: CatPose[] = states.map((cat) => {
                    if (cat.state === 'idle') {
                        return cat.sitAt && now >= cat.sitAt ? 'sit' : 'idle';
                    }
                    if (cat.state === 'fleeing' || cat.state === 'startled') {
                        return `run${cat.walkFrame % RUN_CYCLE_LEN}` as CatPose;
                    }
                    return `walk${cat.walkFrame % WALK_CYCLE_LEN}` as CatPose;
                });
                setPoses((prev) => {
                    let same = prev.length === nextPoses.length;
                    if (same) {
                        for (let k = 0; k < prev.length; k++) {
                            if (prev[k] !== nextPoses[k]) {
                                same = false;
                                break;
                            }
                        }
                    }
                    return same ? prev : nextPoses;
                });
                // Mirror the poses push for bubble messages — same throttle
                // clock, same equality short-circuit. React only re-renders
                // the bubble overlay when a phrase appears/disappears/changes.
                const nextMessages: (string | null)[] = states.map((cat) => cat.message);
                setMessages((prev) => {
                    let same = prev.length === nextMessages.length;
                    if (same) {
                        for (let k = 0; k < prev.length; k++) {
                            if (prev[k] !== nextMessages[k]) {
                                same = false;
                                break;
                            }
                        }
                    }
                    return same ? prev : nextMessages;
                });
                lastPosesPushed = now;
            }

            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('mousemove', onMouseMove);
            document.documentElement.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('click', onClick);
            window.removeEventListener('resize', onResize);
            resizeObs.disconnect();
        };
    }, [count, catSize, enabled, spawn]);

    return {
        poses,
        palettes,
        messages,
        catRefs,
        bubbleRefs,
        enabled,
        count: activeCount,
        maxCount: MAX_CATS,
        spawn,
        removeLast,
        reset,
        isAtInitialCount: activeCount === count,
    };
}
