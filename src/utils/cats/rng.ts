// src/utils/cats/rng.ts
//
// Single funnel point for every randomness draw in the cats simulation.
// Today it's just `Math.random()` — but having ONE seam means a future
// seeded RNG (deterministic testing, replay) can drop in by reassigning
// `rng.next` without touching feature code.
//
// Why a mutable object instead of an export? Reassignment is the swap
// mechanism. Importers cache the `rng` reference, then look up `.next`
// at each call — so updating `rng.next` affects all call sites.

export const rng = {
    next: (): number => Math.random(),
};
