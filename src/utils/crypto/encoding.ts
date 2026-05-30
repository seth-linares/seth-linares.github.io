// src/utils/crypto/encoding.ts
//
// Byte <-> string conversions. Kept dependency-free and isomorphic (browser + Node test env)
// so the engine can be unit-tested without a DOM.

import { Bytes } from '@/types/crypto';

export function bytesToHex(bytes: Uint8Array): string {
    let hex = '';
    for (const b of bytes) hex += b.toString(16).padStart(2, '0');
    return hex;
}

export function hexToBytes(hex: string): Bytes {
    const clean = hex.trim().replace(/\s+/g, '');
    if (clean.length % 2 !== 0) throw new Error('Hex string must have an even number of digits');
    if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error('Hex string contains non-hex characters');
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
}

export function base64ToBytes(b64: string): Bytes {
    const binary = atob(b64.trim());
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Re-wrap encode()'s output so the result is guaranteed ArrayBuffer-backed (Bytes), regardless
// of how the running TextEncoder types it.
export const utf8ToBytes = (text: string): Bytes => new Uint8Array(encoder.encode(text));
export const bytesToUtf8 = (bytes: Uint8Array): string => decoder.decode(bytes);
