// src/utils/crypto/crypto.test.ts

import { describe, it, expect } from 'vitest';
import {
    deriveKey,
    encryptText,
    decryptText,
    decryptAesGcm,
    decryptAesCtrUnauthenticated,
    randomBytes,
} from './index';
import {
    bytesToHex,
    hexToBytes,
    bytesToBase64,
    base64ToBytes,
    utf8ToBytes,
    bytesToUtf8,
} from './encoding';
import { Argon2Params } from '@/types/crypto';

// Argon2id is deliberately slow; use tiny cost params so the suite stays fast.
const TEST_PARAMS: Argon2Params = { memoryKiB: 1024, iterations: 1 };

describe('encoding helpers', () => {
    it('round-trips hex', () => {
        const bytes = randomBytes(32);
        expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes);
    });

    it('round-trips base64', () => {
        const bytes = randomBytes(20);
        expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
    });

    it('round-trips UTF-8 including multibyte characters', () => {
        const text = 'héllo 🐱 world';
        expect(bytesToUtf8(utf8ToBytes(text))).toBe(text);
    });

    it('rejects malformed hex', () => {
        expect(() => hexToBytes('abc')).toThrow();
        expect(() => hexToBytes('zz')).toThrow();
    });
});

describe('Argon2id key derivation', () => {
    it('is deterministic for identical inputs', async () => {
        const salt = utf8ToBytes('0123456789abcdef');
        const a = await deriveKey('correct horse', salt, TEST_PARAMS);
        const b = await deriveKey('correct horse', salt, TEST_PARAMS);
        expect(a.length).toBe(32);
        expect(bytesToHex(a)).toBe(bytesToHex(b));
    });

    it('produces a different key when the passphrase changes', async () => {
        const salt = utf8ToBytes('0123456789abcdef');
        const a = await deriveKey('passphrase-a', salt, TEST_PARAMS);
        const b = await deriveKey('passphrase-b', salt, TEST_PARAMS);
        expect(bytesToHex(a)).not.toBe(bytesToHex(b));
    });

    it('produces a different key when the salt changes', async () => {
        const a = await deriveKey('same pass', utf8ToBytes('salt-one-1234567'), TEST_PARAMS);
        const b = await deriveKey('same pass', utf8ToBytes('salt-two-1234567'), TEST_PARAMS);
        expect(bytesToHex(a)).not.toBe(bytesToHex(b));
    });
});

describe('AES-256-GCM authenticated encryption', () => {
    it('round-trips plaintext through encrypt + decrypt', async () => {
        const message = 'Meet me at the docks at midnight. Bring the cat.';
        const run = await encryptText({ password: 'pw', plaintext: message, params: TEST_PARAMS });
        const recovered = await decryptText({
            password: 'pw',
            salt: run.salt,
            iv: run.iv,
            ciphertext: run.ciphertext,
            params: TEST_PARAMS,
        });
        expect(recovered).toBe(message);
    });

    it('rejects the wrong passphrase', async () => {
        const run = await encryptText({
            password: 'right',
            plaintext: 'secret',
            params: TEST_PARAMS,
        });
        await expect(
            decryptText({
                password: 'wrong',
                salt: run.salt,
                iv: run.iv,
                ciphertext: run.ciphertext,
                params: TEST_PARAMS,
            })
        ).rejects.toThrow();
    });

    it('detects tampering — flipping a single ciphertext bit fails the GCM tag', async () => {
        const run = await encryptText({ password: 'pw', plaintext: 'secret', params: TEST_PARAMS });
        const tampered = new Uint8Array(run.ciphertext);
        tampered[0] ^= 0x01;
        await expect(decryptAesGcm(run.key, run.iv, tampered)).rejects.toThrow();
    });
});

describe('AES-CTR contrast (unauthenticated)', () => {
    it("reproduces the plaintext using GCM's keystream", async () => {
        const message = 'Meet me at the docks at midnight.';
        const run = await encryptText({ password: 'pw', plaintext: message, params: TEST_PARAMS });
        const viaCtr = await decryptAesCtrUnauthenticated(run.key, run.iv, run.ciphertext);
        expect(viaCtr).toBe(message);
    });

    it('silently corrupts a tampered byte instead of rejecting it, unlike GCM', async () => {
        const message = 'Meet me at the docks at midnight.';
        const run = await encryptText({ password: 'pw', plaintext: message, params: TEST_PARAMS });
        const tampered = new Uint8Array(run.ciphertext);
        tampered[0] ^= 0x01;

        // GCM refuses the altered bytes…
        await expect(decryptAesGcm(run.key, run.iv, tampered)).rejects.toThrow();

        // …while unauthenticated CTR returns text, with the corruption localized to byte 0.
        const viaCtr = await decryptAesCtrUnauthenticated(run.key, run.iv, tampered);
        expect(viaCtr).not.toBe(message);
        expect(viaCtr.length).toBe(message.length);
        expect(viaCtr.slice(1)).toBe(message.slice(1));
    });

    it('matches the UI shortcut: flipping data byte i == flipping plaintext byte i', async () => {
        const message = 'Attack at dawn.';
        const run = await encryptText({ password: 'pw', plaintext: message, params: TEST_PARAMS });
        const i = 4;
        const tampered = new Uint8Array(run.ciphertext);
        tampered[i] ^= 0x01;

        const viaCtr = await decryptAesCtrUnauthenticated(run.key, run.iv, tampered);

        // The UI predicts CTR's output purely by flipping plaintext byte i — assert they agree.
        const predicted = utf8ToBytes(message);
        predicted[i] ^= 0x01;
        expect(viaCtr).toBe(bytesToUtf8(predicted));
    });
});

describe('Argon2 parameters feed into the KDF', () => {
    const salt = utf8ToBytes('fixed-salt-16byt');

    it('changing memory cost changes the derived key', async () => {
        const a = await deriveKey('pw', salt, { memoryKiB: 1024, iterations: 1 });
        const b = await deriveKey('pw', salt, { memoryKiB: 2048, iterations: 1 });
        expect(bytesToHex(a)).not.toBe(bytesToHex(b));
    });

    it('changing iterations changes the derived key', async () => {
        const a = await deriveKey('pw', salt, { memoryKiB: 1024, iterations: 1 });
        const b = await deriveKey('pw', salt, { memoryKiB: 1024, iterations: 3 });
        expect(bytesToHex(a)).not.toBe(bytesToHex(b));
    });
});
