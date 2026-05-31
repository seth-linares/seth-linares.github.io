// src/utils/crypto/index.ts
//
// A tiny, browser-native encryption engine that mirrors PawPass's stack: an Argon2id
// memory-hard KDF (hash-wasm) feeding AES-256-GCM authenticated encryption (Web Crypto).
// Everything here is pure and runs entirely client-side — no key or plaintext leaves the page.

import { Argon2Params, Bytes } from '@/types/crypto';
import {
    KEY_LENGTH_BYTES,
    IV_LENGTH_BYTES,
    SALT_LENGTH_BYTES,
    ARGON2_PARALLELISM,
} from './constants';
import { hexToBytes, utf8ToBytes, bytesToUtf8 } from './encoding';

const AES_ALGORITHM = 'AES-GCM';

export function randomBytes(length: number): Bytes {
    return crypto.getRandomValues(new Uint8Array(length));
}

// Stretch a passphrase into a 256-bit key. Argon2id's cost is dominated by `memorySize`,
// which is exactly what makes it resistant to GPU/ASIC cracking.
export async function deriveKey(
    password: string,
    salt: Bytes,
    params: Argon2Params
): Promise<Bytes> {
    // Dynamically imported so the Argon2 WASM (its own `crypto` chunk) only downloads on the
    // first derive — i.e. on first encrypt/decrypt — not as part of the initial page load.
    const { argon2id } = await import('hash-wasm');
    const hex = await argon2id({
        password,
        salt,
        parallelism: ARGON2_PARALLELISM,
        iterations: params.iterations,
        memorySize: params.memoryKiB,
        hashLength: KEY_LENGTH_BYTES,
        outputType: 'hex',
    });
    return hexToBytes(hex);
}

async function importAesKey(keyBytes: Bytes): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', keyBytes, AES_ALGORITHM, false, ['encrypt', 'decrypt']);
}

// Web Crypto appends the 16-byte GCM authentication tag to the ciphertext it returns.
export async function encryptAesGcm(keyBytes: Bytes, iv: Bytes, plaintext: string): Promise<Bytes> {
    const key = await importAesKey(keyBytes);
    const buffer = await crypto.subtle.encrypt(
        { name: AES_ALGORITHM, iv },
        key,
        utf8ToBytes(plaintext)
    );
    return new Uint8Array(buffer);
}

// Throws if the tag doesn't verify (wrong key or tampered ciphertext) — that rejection is
// the whole point of authenticated encryption.
export async function decryptAesGcm(
    keyBytes: Bytes,
    iv: Bytes,
    ciphertext: Bytes
): Promise<string> {
    const key = await importAesKey(keyBytes);
    const buffer = await crypto.subtle.decrypt({ name: AES_ALGORITHM, iv }, key, ciphertext);
    return bytesToUtf8(new Uint8Array(buffer));
}

// Decrypt the GCM ciphertext's data with AES-CTR using GCM's own keystream but WITHOUT the auth
// tag — i.e. what "encryption with no authentication" hands back. GCM is CTR mode plus a tag, so
// for a 96-bit IV the data counter is J0 + 1 = IV || 0x00000002 (a 32-bit counter) and the
// trailing 16-byte tag is dropped. Tampered bytes surface as silent corruption here rather than
// being rejected — which is exactly the point of the contrast.
export async function decryptAesCtrUnauthenticated(
    keyBytes: Bytes,
    iv: Bytes,
    gcmCiphertext: Bytes
): Promise<string> {
    const data = gcmCiphertext.subarray(0, gcmCiphertext.length - 16);
    const counter = new Uint8Array(16);
    counter.set(iv, 0);
    counter[15] = 0x02;
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-CTR', false, ['decrypt']);
    const buffer = await crypto.subtle.decrypt({ name: 'AES-CTR', counter, length: 32 }, key, data);
    return bytesToUtf8(new Uint8Array(buffer));
}

export interface EncryptTextInput {
    password: string;
    plaintext: string;
    params: Argon2Params;
}

export interface EncryptTextOutput {
    salt: Bytes;
    iv: Bytes;
    key: Bytes;
    ciphertext: Bytes;
    derivationMs: number;
}

// Full encrypt path: fresh random salt + IV, derive, encrypt, and report how long the KDF took.
export async function encryptText({
    password,
    plaintext,
    params,
}: EncryptTextInput): Promise<EncryptTextOutput> {
    const salt = randomBytes(SALT_LENGTH_BYTES);
    const iv = randomBytes(IV_LENGTH_BYTES);

    const start = performance.now();
    const key = await deriveKey(password, salt, params);
    const derivationMs = performance.now() - start;

    const ciphertext = await encryptAesGcm(key, iv, plaintext);
    return { salt, iv, key, ciphertext, derivationMs };
}

export interface DecryptTextInput {
    password: string;
    salt: Bytes;
    iv: Bytes;
    ciphertext: Bytes;
    params: Argon2Params;
}

// Full decrypt path: re-derive the key from the passphrase + salt, then verify and decrypt.
export async function decryptText({
    password,
    salt,
    iv,
    ciphertext,
    params,
}: DecryptTextInput): Promise<string> {
    const key = await deriveKey(password, salt, params);
    return decryptAesGcm(key, iv, ciphertext);
}
