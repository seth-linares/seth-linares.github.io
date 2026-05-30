// src/utils/crypto/constants.ts

import { Argon2Params } from '@/types/crypto';

// AES-256 → 32-byte key. GCM standard IV is 96 bits. 128-bit salt is plenty for Argon2.
export const KEY_LENGTH_BYTES = 32;
export const IV_LENGTH_BYTES = 12;
export const SALT_LENGTH_BYTES = 16;

// Slider ranges. Memory is expressed in MiB here (converted to KiB before hitting the KDF).
// Caps are kept modest so derivation stays responsive on the main thread — the point is to
// make memory-hardness *visible*, not to freeze the tab.
export const MEMORY_MIB = { min: 8, max: 64, step: 1, default: 19 } as const;
export const ITERATIONS = { min: 1, max: 5, step: 1, default: 2 } as const;

// Argon2 lanes. Fixed at 1 because hash-wasm runs single-threaded in the browser — extra lanes
// change the derived key but not the wall-clock time, so we don't expose it as a tunable knob.
export const ARGON2_PARALLELISM = 1;

export const DEFAULT_ARGON2_PARAMS: Argon2Params = {
    memoryKiB: MEMORY_MIB.default * 1024,
    iterations: ITERATIONS.default,
};
