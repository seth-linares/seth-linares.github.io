// src/utils/cats/names.ts
//
// Cat-name pool and picker. Used by the factory at cat-construction time so
// every CatState carries a stable `name` string. Future hover-tooltip code
// reads from AnimatedCatsState.names[i] (lockstep with palettes).
//
// Names are food-themed because (a) they're whimsical and (b) the pool is
// big enough that even at MAX_CATS = 16 collisions are unusual.

import { rng } from './rng';

const NAME_POOL = [
    'Mochi',
    'Pepper',
    'Cloud',
    'Biscuit',
    'Olive',
    'Sushi',
    'Pickle',
    'Mango',
    'Pumpkin',
    'Tofu',
    'Tater',
    'Noodle',
    'Waffle',
    'Bagel',
    'Pesto',
    'Miso',
    'Cookie',
    'Marshmallow',
    'Sprout',
    'Nutmeg',
    'Beans',
    'Ramen',
    'Dumpling',
    'Pancake',
    'Latte',
    'Smudge',
    'Boots',
    'Whiskers',
    'Mittens',
    'Sesame',
] as const;

export function pickName(): string {
    return NAME_POOL[Math.floor(rng.next() * NAME_POOL.length)];
}
