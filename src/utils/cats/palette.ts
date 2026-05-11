// src/utils/cats/palette.ts
//
// Coat-color → personality mapping plus the index-cycling helpers used by
// init/reset to seed initial cats. Personality is keyed by coat color so the
// same color is recognizably the same cat across the page.

import { CAT_PALETTES, type CatPalette } from '@/types/pixel-cat';
import type { CatBehavior } from './types';

export const PALETTE_KEYS = ['orange', 'black', 'gray', 'siamese'] as const;
// Nominal type for "a known palette coat". Use this anywhere a function takes
// a palette identifier — passing a string typo now fails at the call site
// instead of silently falling through to a default.
export type PaletteKey = (typeof PALETTE_KEYS)[number];

export const PALETTE_BEHAVIORS: Record<PaletteKey, CatBehavior> = {
    orange: 'chill',
    black: 'playful',
    gray: 'chill',
    siamese: 'shy',
};

export function paletteForIndex(i: number): CatPalette {
    return CAT_PALETTES[PALETTE_KEYS[i % PALETTE_KEYS.length]];
}

export function behaviorForIndex(i: number): CatBehavior {
    return PALETTE_BEHAVIORS[PALETTE_KEYS[i % PALETTE_KEYS.length]];
}
