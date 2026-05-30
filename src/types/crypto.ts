// src/types/crypto.ts

// Tunable Argon2id cost parameters. Memory is stored in KiB (what the KDF expects); the UI
// presents it in MiB. Parallelism is fixed (see ARGON2_PARALLELISM) — single-threaded in the
// browser it changes the key but not the time, so it isn't a user-facing knob.
export interface Argon2Params {
    memoryKiB: number;
    iterations: number;
}

// Byte arrays handed to Web Crypto must be ArrayBuffer-backed: the post-TS-5.7 DOM lib's
// BufferSource rejects the SharedArrayBuffer possibility carried by a bare Uint8Array.
export type Bytes = Uint8Array<ArrayBuffer>;

// Raw bytes from one encryption run. We hold onto everything needed to decrypt so the
// round-trip + tamper demo can run without asking the user to re-enter anything.
export interface EncryptionRun {
    salt: Bytes;
    iv: Bytes;
    key: Bytes;
    ciphertext: Bytes;
    derivationMs: number;
    params: Argon2Params;
    plaintext: string;
}

// Interactive tamper state for the integrity check: the ciphertext split into clickable data
// bytes + the (non-clickable) auth tag, plus what each cipher does with the bytes the user flips.
export interface TamperView {
    data: number[];
    tag: number[];
    tamperedBytes: Set<number>;
    gcmRejected: boolean;
    ctrPlaintext: string;
    originalPlaintext: string;
    ciphertextHex: string;
}

// Display-ready projection of an EncryptionRun (key material rendered as hex).
export interface EncryptionView {
    saltHex: string;
    ivHex: string;
    keyHex: string;
    derivationMs: number;
    memoryKiB: number;
    iterations: number;
}
