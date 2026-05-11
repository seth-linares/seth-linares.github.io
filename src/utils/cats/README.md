# Cats ECS — API & Extension Guide

The animated-cats overlay is built as a small **Entity-Component-System** purpose-fit to this codebase. This doc explains how the pieces fit and how to extend it without breaking the rAF tick. Read this before adding a state, a phase, a bubble event, or an interaction listener.

## TL;DR mental model

| ECS concept | In this codebase |
|---|---|
| **Entity** | `CatState` — one record per cat in `statesRef.current` |
| **Components** | The fields on `CatState` (position, animation, behavior, social cooldowns, bubble, name, and the tagged `run` union for state-specific data) |
| **Systems** | Per-frame functions in `src/utils/cats/tick/*` (each takes `(cat, ctx)` and mutates the cat in place) |
| **Orchestrator** | The rAF loop in `src/hooks/useAnimatedCats.ts` — calls phases in order for every cat, then pushes throttled snapshots to React state |
| **Renderer** | `<AnimatedCats />`, `<CatTray />`, `<InteractiveOverlay />`, plus the inline `CatBubble` |
| **Singleton seam** | `rng` (random source) — module-level mutable so a seeded swap is one-liner |

The simulation never touches the DOM except through three refs the renderer hands it: `catRefs` (sprite layer, `-z-10`), `bubbleRefs` (bubble layer, `z-10`), `interactiveRefs` (hover/click layer, `z-15`). The hook writes `style.transform` directly each frame; React only re-renders when discrete React state changes (poses, messages, names — all throttled at `PUSH_POSE_MS = 90 ms`).

## File map

```
src/utils/cats/
  types.ts          Entity shape + discriminated union + branded coord types
  constants.ts      All tunable numbers, grouped by subsystem
  palette.ts        Coat → personality mapping (PALETTE_BEHAVIORS) + index cyclers
  targets.ts        Pure geometry helpers (pickTarget, pickEscapeTarget, pathIsClear, …)
  bubbles.ts        BubbleEvent union, BUBBLE_POOLS, setMessage(cat, event, duration)
  rng.ts            Math.random() shim — single funnel for randomness
  names.ts          Name pool (30 food-themed names) + pickName()
  factory.ts        createInitialCatState() + spawnRandomCat() — sole construction path
  tick/
    types.ts        TickContext shared by every phase
    cursor.ts       Phase 1: startle-expiration + cursor flee/safe
    social.ts       Phase 2: playful cat picks a visit target
    visit.ts        Phase 3: visit tracking + meetup arrival branches
    cover.ts        Phase 4: AABB inCover detection
    movement.ts     Phase 5: seek+avoidance + idle separation + position clamp + stuck check
    animation.ts    Phase 6: walk-frame advance + writeCatTransform / writeBubble / writeInteractive
    publish.ts      End of frame: throttled poses + messages → React state

src/hooks/useAnimatedCats.ts     React glue: state, refs, spawn/removeLast/reset, event listeners, the rAF orchestrator
src/components/
  AnimatedCats.tsx               Orchestrator — mounts the three overlays + the tray
  cats/
    CatTray.tsx                  Drag-to-spawn tray + ghost cat during drag
    InteractiveOverlay.tsx       Per-cat hover/click surface (currently empty — attach listeners here for new features)
```

## The entity (`CatState`)

Every cat is one record. Fields:

```ts
interface CatState {
    // Position + animation (common to every state)
    x: DocPos;
    y: DocPos;
    speed: number;
    facingLeft: boolean;
    distSinceFrame: number;       // accumulates each frame; resets when walkFrame advances
    walkFrame: number;            // current sprite cycle frame (0..WALK_CYCLE_LEN-1)

    // Identity (assigned once at construction)
    behavior: CatBehavior;        // 'chill' | 'playful' | 'shy'
    palette: CatPalette;          // sprite colors
    name: string;                 // from names.ts pool

    // Social cooldowns (read across multiple states)
    nextSocialCheck: number;      // earliest performance.now() for a fresh visit attempt
    lastProgressAt: number;       // for stuck-detection (movement.ts)
    lastMeetupAt: number;         // gate for the social-pick cascade preventer

    // Bubble system
    message: string | null;
    messageUntil: number;

    // The state machine
    run: CatRunState;             // see below
}
```

### `CatRunState` — the discriminated union

State-specific data lives **inside** the variant. The compiler enforces that you only read `visitTarget` when you're in the `visiting` variant, etc.

```ts
type CatRunState =
    | { kind: 'walking';  targetX: DocPos; targetY: DocPos }
    | { kind: 'idle';     idleUntil: number; sitAt: number }
    | { kind: 'fleeing';  targetX: DocPos; targetY: DocPos }
    | { kind: 'visiting'; visitTarget: number; targetX: DocPos; targetY: DocPos }
    | { kind: 'startled'; startleUntil: number; targetX: DocPos; targetY: DocPos };
```

**Transitions are atomic assignments.** Build a whole new `cat.run = { kind: 'X', ... }`. The compiler won't let you forget a field. Old variant data is automatically discarded.

**Narrowing is your friend.** After `if (cat.run.kind === 'visiting') { ... }`, TS knows `cat.run.visitTarget` is a `number`. Use the narrowing — don't reach across the union with non-null assertions.

**Exhaustiveness check** in `tick/publish.ts`: the `poseForCat` switch ends with `const _exhaustive: never = cat.run;`. Add a new variant and this will scream until you handle it — that's the bug-prevention payoff.

### Branded coord types

```ts
type DocPos = number & { readonly __doc: unique symbol };
type ViewportPos = number & { readonly __vp: unique symbol };
```

At runtime these are plain numbers; the brand is a phantom property the compiler tracks. **The only legitimate way to convert** is the seam:

```ts
import { toDocX, toDocY, asViewport } from './types';

const docX = toDocX(asViewport(e.clientX));   // adds window.scrollX
const docY = toDocY(asViewport(e.clientY));   // adds window.scrollY
```

If you find yourself reaching for `asDoc(someClientY)` you're probably skipping the scroll conversion — stop and think.

Arithmetic on a `DocPos` returns plain `number` (TS rules), so you'll need `asDoc(cat.x + dx)` when assigning back. The factory and the picker functions in `targets.ts` are already wired to return `DocPos`; you only need `asDoc` at the result of arithmetic you do yourself.

## Tick phase ordering (don't reshuffle without reading this)

Per cat, per frame:

```
1. updateStartleExpiration   if startleUntil elapsed: → walking + new target
2. updateCursorFlee          read mouseDoc; enter/leave fleeing state
3. updateSocialPick          playful cats decide to visit (sets visitTarget)
4. updateVisit               aim toward visitTarget; on arrival, branch on personality
5. detectCover               AABB against obstacles; returns inCover
6. stepMovement              the big one — seek, avoidance, idle separation, arrival
7. clampPosition             clamp into doc bounds (with navbar pad)
8. updateStuckCheck          if no progress for STUCK_THRESHOLD_MS, repick target
9. updateAnimation           advance cat.walkFrame based on stepDist
10. writeCatTransform        DOM transform on the catRefs[i] element
11. writeBubble              DOM transform on the bubbleRefs[i] element + expire message
12. writeInteractive         DOM transform on the interactiveRefs[i] element
```

After the loop:

```
13. publishThrottled         setPoses + setMessages if PUSH_POSE_MS elapsed
```

**Ordering rules:**
- Startle expiration runs **first** so a cat finishing a startle in this frame doesn't get stuck.
- Cursor flee runs **before** social, because flee should win over a visit attempt.
- Visit runs **after** social (social may have just set `visitTarget`).
- Cover detection runs **before** movement (movement uses `inCover`).
- Position clamp runs **after** movement (the clamp corrects any over-shoot).
- All DOM writes run last so they see the cat's final position for the frame.

If you add a phase, slot it into the right place and update this doc.

## `TickContext` — what each phase gets

```ts
interface TickContext {
    now: number;                                 // performance.now() captured once per frame
    dims: DocDims;                               // current document dimensions
    obstacles: ObstacleRect[];                   // cached [data-cat-obstacle] rects
    states: CatState[];                          // ALL cats (read neighbors via states[j])
    i: number;                                   // current cat's index
    catSize: number;                             // sprite size in px (default 56)
    mouseDoc: { x: DocPos; y: DocPos } | null;   // cursor in DOC coords; null when off-page
}
```

Phases that don't need a field just ignore it. **Don't add per-cat allocations to the context** — it's built once per cat per frame. If you need shared per-frame work (e.g. distance to nearest food), do it in the orchestrator once, stash the result on the context.

## Extension recipes

### Add a new bubble event

1. Add the event key to `BubbleEvent` in `bubbles.ts`.
2. Add a phrase array to `BUBBLE_POOLS`.
3. Call `setMessage(cat, 'your_event', durationMs?)` at the transition site.

That's it. Pools are deliberately short and silly — tweak content here without touching the simulation.

### Add a new state variant (worked example: `'petting'`)

1. **Extend the union** in `types.ts`:
   ```ts
   type CatRunState =
       | ...existing...
       | { kind: 'petting'; petUntil: number; pointerId?: number };
   ```

2. **Build the variant somewhere** — at the transition site (e.g. an input handler):
   ```ts
   cat.run = {
       kind: 'petting',
       petUntil: performance.now() + 3000,
       pointerId: e.pointerId,
   };
   ```

3. **Handle the variant in publish.ts**. The `_exhaustive: never` line will scream until you add a `case 'petting':` to `poseForCat`. Decide which pose this state shows (likely `'sit'` or a new pose).

4. **Add tick-phase guards where needed**. Run `grep -rn "cat.run.kind" src/utils/cats/tick` — every phase that branches on state will need a decision about `'petting'`. Usually: cursor.ts should skip the flee check (cat is happy, not scared); social.ts should skip the visit pick (cat is busy); movement.ts probably treats it like idle (no seek).

5. **Add an exit phase** if the new state has a timeout (like `startled`/`idle`). Slot it next to `updateStartleExpiration` in `cursor.ts`, or give it its own file (`tick/pet.ts`).

6. **Add bubble events** for entering/leaving the state.

7. Update **this doc's tick-ordering list** if you added a new phase.

### Add a new tick phase

1. Create `src/utils/cats/tick/yourPhase.ts`:
   ```ts
   import type { CatState } from '../types';
   import type { TickContext } from './types';

   export function updateYourPhase(cat: CatState, ctx: TickContext): void {
       // narrow on cat.run.kind to act on specific states
   }
   ```

2. Import + call from the orchestrator's `for` loop in `useAnimatedCats.ts`. Slot it into the right ordinal position (see the table above).

3. If the phase needs a return value (like `detectCover` returning `inCover`), make it a `number`/`boolean` return and pass it forward. **Don't pollute `TickContext`** with phase outputs — that couples phases.

4. If the phase needs per-frame shared work (e.g. spatial hash of neighbors), compute it in the orchestrator once and add to `TickContext`.

5. Update this doc.

### Attach an interaction to cats (hover, click, etc.)

The `InteractiveOverlay` mounts a per-cat `<div>` at `z-15`, sized to the sprite. The wrapper is `pointer-events-none` so the empty space falls through; each per-cat div is `pointer-events-auto` so it intercepts events only over the cat.

Today the divs have no listeners. To add e.g. a hover-name tooltip:

1. Pass `names` from the hook to `<InteractiveOverlay />` (and accept it in props).
2. Add `onPointerEnter` / `onPointerLeave` to each per-cat div, tracking `hoveredIdx` in component state.
3. Render a tooltip positioned via `interactiveRefs.current[hoveredIdx]?.getBoundingClientRect()` (or have the rAF loop maintain a separate tooltip ref).

For a click-driven interaction like petting:
1. Add `onPointerDown` to the per-cat div that calls an imperative API surfaced by the hook (e.g. `startPetting(catIdx, pointerId)`).
2. Imperative API mutates `statesRef.current[i].run = { kind: 'petting', ... }`.
3. The rAF tick picks it up next frame.

**Beware**: `pointer-events-auto` on the cat div blocks clicks to page content beneath it. That's an explicit design tradeoff — cats are interactive entities now. If a specific cat shouldn't be interactive in some state, set `pointer-events: none` on its div via inline style.

### Add an entity field

1. Add to `CatState` in `types.ts` (decide whether it's a common field or belongs in a `run` variant).
2. Seed it in `factory.ts`'s `createInitialCatState()`.
3. Read/write from the relevant tick phase(s).
4. If consumers need it surfaced to React, add it to `AnimatedCatsState` and maintain lockstep in `spawn`/`removeLast`/`reset` + the init block.

### Swap the RNG (testing, replay)

```ts
import { rng } from '@/utils/cats/rng';

// In a test setup:
let seed = 12345;
rng.next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
};
```

All randomness in the simulation routes through `rng.next()` — including the bubble pool picks and name picks. Reset `rng.next = () => Math.random()` to restore.

### Spawn / remove / reset — the lockstep contract

Five React state arrays mirror the simulation entity count: `poses`, `palettes`, `messages`, `names`. Plus the three ref arrays (`catRefs`, `bubbleRefs`, `interactiveRefs`).

**Every mutating helper must keep all of these in sync**:

| Helper | Action |
|---|---|
| `spawn()` | append to `palettes`, `messages` (with the spawn-bubble), `names`. Ref arrays auto-grow when React renders the new entries. |
| `removeLast()` | `slice(0, -1)` on `palettes`, `messages`, `names`. Ref arrays auto-shrink. |
| `reset()` | full rebuild of `palettes` (cycle), `messages` (all null), `names` (from new cats). |
| Effect init | seed `names` after constructing the initial cats (palettes already seeded in `useState` initializer). |

If you add a new tracked array (e.g. `happiness: number[]` for the feeding feature), it joins this contract. Forgetting a slice/push is a classic foot-gun.

## Verification when extending

Every change should pass:

```bash
pnpm build    # tsc -b will catch most narrowing bugs
pnpm lint
pnpm test --run
```

Then a manual smoke test on `pnpm dev` at `/`:
- 8 cats wander, sit, animate frames at 60fps
- Cursor → cats flee + emit "ah!"/"eep!"
- Click near a cat → startle + "!"/"!!"
- Wait for a black cat to visit a chill cat — both pause, both emit friendly bubbles
- Drag a tray sprite → new cat spawns with a "hi!" bubble
- Walk a cat under the typewriter terminal — bubble stays visible (proves z-10 layer)

For interaction features, also: hover and click cat divs in DevTools to confirm the overlay intercepts.

## Performance budget

At `MAX_CATS = 16`, the per-frame work is roughly:

| Item | Cost |
|---|---|
| Avoidance loop (per cat, iterates all other cats) | 16 × 15 ≈ 240 ops |
| Cover detection (per cat, iterates obstacles) | 16 × ~10 = 160 ops |
| Phase transitions | usually one branch per cat |
| 48 DOM transform writes (cats + bubbles + interactives) | cheap; refs cached |
| React state push (throttled to 90ms) | ~once per 5–6 frames |

Total: a few thousand JS math ops + 48 DOM writes per frame. V8 JITs this to near-native. **Adding another per-cat-per-cat O(n²) loop costs another ~240 ops** — fine. Adding per-cat-per-obstacle costs another ~160 ops — also fine. Adding anything that scales with `MAX_CATS²` plus an inner loop (e.g. computing pairwise visit eligibility 16×16 with a 16-deep inner scan) needs a thought.

If you ever bump `MAX_CATS` above ~50, revisit the avoidance loop — a spatial hash on `obstaclesRef`-like cadence becomes worthwhile.

## What's NOT here (yet)

These are planned but not implemented:

- **Petting** — sustained click pets a cat instead of startling; cat enters a 'petting' state, emits "purr"/"<3" bubbles. Foundation: extend the union, add a `tick/pet.ts` phase, attach a pointer-down listener in `InteractiveOverlay`.
- **Feeding** — drag food onto the page; nearby cats walk to and consume it. Foundation: new module `src/utils/cats/food.ts`, a `FoodTray.tsx`, two new `run` variants (`'seekingFood'`, `'eating'`), a new tick phase.
- **Hover for name + personality** — tooltip shows `cat.name` + `cat.behavior` when the cursor enters the cat's interactive div. `name` is already on `CatState` and surfaced via `AnimatedCatsState.names`; just needs a hover-state component reading `interactiveRefs`.

Each is meant to be a small, focused PR. If yours is growing big, the refactor was wrong — file an issue (or shout at the doc).
