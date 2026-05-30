// src/hooks/crypto_playground/useCryptoPlayground.ts

import { useState } from 'react';
import { encryptText } from '@/utils/crypto';
import { bytesToHex, utf8ToBytes, bytesToUtf8 } from '@/utils/crypto/encoding';
import { DEFAULT_ARGON2_PARAMS } from '@/utils/crypto/constants';
import { Argon2Params, EncryptionRun, EncryptionView, TamperView } from '@/types/crypto';

const SAMPLE_PASSPHRASE = 'correct horse battery staple';
const SAMPLE_PLAINTEXT = 'Attack at dawn.';

// AES-GCM appends a 128-bit authentication tag after the ciphertext data.
const TAG_BYTES = 16;

// Let the "Deriving…" state actually paint before the synchronous, main-thread WASM hash
// blocks the UI. A double rAF guarantees at least one repaint of the pending state first.
const nextFrame = () =>
    new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

function useCryptoPlayground() {
    const [password, setPassword] = useState(SAMPLE_PASSPHRASE);
    const [plaintext, setPlaintext] = useState(SAMPLE_PLAINTEXT);
    const [params, setParams] = useState<Argon2Params>(DEFAULT_ARGON2_PARAMS);

    const [run, setRun] = useState<EncryptionRun | null>(null);
    const [tamperedBytes, setTamperedBytes] = useState<Set<number>>(new Set());
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Increments on every successful encrypt, so the timing readout can re-flash even when two
    // derivations land on the same rounded millisecond value.
    const [deriveSeq, setDeriveSeq] = useState(0);

    const setParam = (key: keyof Argon2Params, value: number) => {
        setParams((prev) => ({ ...prev, [key]: value }));
    };

    const handleEncrypt = async () => {
        setError(null);
        if (!password) {
            setError('Enter a passphrase first.');
            return;
        }
        if (!plaintext) {
            setError('Enter some plaintext to encrypt.');
            return;
        }

        setIsEncrypting(true);
        try {
            await nextFrame();
            const output = await encryptText({ password, plaintext, params });
            setRun({ ...output, params, plaintext });
            setTamperedBytes(new Set());
            setDeriveSeq((n) => n + 1);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setRun(null);
        } finally {
            setIsEncrypting(false);
        }
    };

    // Flip / restore a single ciphertext data byte — the user playing attacker.
    const toggleByte = (index: number) => {
        setTamperedBytes((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const resetTamper = () => setTamperedBytes(new Set());

    const resetResult = () => {
        setRun(null);
        setTamperedBytes(new Set());
        setError(null);
    };

    const view: EncryptionView | null = run
        ? {
              saltHex: bytesToHex(run.salt),
              ivHex: bytesToHex(run.iv),
              keyHex: bytesToHex(run.key),
              derivationMs: run.derivationMs,
              memoryKiB: run.params.memoryKiB,
              iterations: run.params.iterations,
          }
        : null;

    // The interactive tamper model. AES-CTR XORs each byte independently, so flipping ciphertext
    // data byte i flips plaintext byte i by the same amount — which lets us show CTR's result
    // instantly, with no per-click crypto call. (decryptAesCtrUnauthenticated proves this exact
    // equivalence in the test suite.) GCM, by contrast, rejects the moment any byte changes.
    const tamper: TamperView | null = run
        ? (() => {
              const splitAt = run.ciphertext.length - TAG_BYTES;
              const corrupted = utf8ToBytes(run.plaintext);
              tamperedBytes.forEach((i) => {
                  if (i < corrupted.length) corrupted[i] ^= 0x01;
              });
              return {
                  data: Array.from(run.ciphertext.subarray(0, splitAt)),
                  tag: Array.from(run.ciphertext.subarray(splitAt)),
                  tamperedBytes,
                  gcmRejected: tamperedBytes.size > 0,
                  ctrPlaintext: bytesToUtf8(corrupted),
                  originalPlaintext: run.plaintext,
                  ciphertextHex: bytesToHex(run.ciphertext),
              };
          })()
        : null;

    return {
        password,
        setPassword,
        plaintext,
        setPlaintext,
        params,
        setParam,
        view,
        deriveSeq,
        tamper,
        toggleByte,
        resetTamper,
        isEncrypting,
        error,
        handleEncrypt,
        resetResult,
    };
}

export default useCryptoPlayground;
