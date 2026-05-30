// src/components/crypto_playground/IntegrityCheck.tsx

import { useState } from 'react';
import { FiCheckCircle, FiXCircle, FiShieldOff, FiCopy, FiCheck } from 'react-icons/fi';
import { TamperView } from '@/types/crypto';

const toHexByte = (n: number) => n.toString(16).padStart(2, '0');

// Render `text`, highlighting code points that differ from `original` — the bytes the user
// flipped show up corrupted here.
function CorruptedText({ text, original }: { text: string; original: string }) {
    const chars = [...text];
    const orig = [...original];
    return (
        <>
            {chars.map((ch, i) =>
                ch === orig[i] ? (
                    <span key={i}>{ch}</span>
                ) : (
                    <mark key={i} className="bg-warning text-warning-content rounded-sm px-0.5">
                        {ch}
                    </mark>
                )
            )}
        </>
    );
}

interface IntegrityCheckProps {
    tamper: TamperView;
    onToggleByte: (index: number) => void;
    onResetTamper: () => void;
}

function IntegrityCheck({ tamper, onToggleByte, onResetTamper }: IntegrityCheckProps) {
    const {
        data,
        tag,
        tamperedBytes,
        gcmRejected,
        ctrPlaintext,
        originalPlaintext,
        ciphertextHex,
    } = tamper;
    const count = tamperedBytes.size;
    const [copied, setCopied] = useState(false);

    const copyHex = async () => {
        try {
            await navigator.clipboard.writeText(ciphertextHex);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be unavailable in insecure contexts — fail quietly.
        }
    };

    return (
        <div>
            <div className="divider my-1 text-xs uppercase tracking-wider">integrity check</div>
            <p className="text-xs text-base-content/60 mb-3">
                Now you&apos;re the attacker. Click any byte of the ciphertext to flip it — like
                modifying data in transit — and watch what each cipher does with the change.
            </p>

            <div className="bg-base-300 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-base-content/60">
                        Ciphertext
                    </span>
                    <button
                        type="button"
                        onClick={copyHex}
                        className={`btn btn-xs gap-1 ${copied ? 'btn-success' : 'btn-ghost'}`}
                    >
                        {copied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                        {copied ? 'copied' : 'copy hex'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-1 font-mono text-xs leading-none">
                    {data.map((b, i) => {
                        const flipped = tamperedBytes.has(i);
                        const value = flipped ? b ^ 0x01 : b;
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onToggleByte(i)}
                                title={
                                    flipped
                                        ? `byte ${i} flipped — click to restore`
                                        : `byte ${i} — click to flip`
                                }
                                className={`px-1.5 py-1 rounded transition-colors ${
                                    flipped
                                        ? 'bg-warning text-warning-content'
                                        : 'bg-base-100 text-base-content/80 hover:bg-primary/20'
                                }`}
                            >
                                {toHexByte(value)}
                            </button>
                        );
                    })}

                    <span className="mx-1 self-center text-[10px] uppercase tracking-wider text-base-content/40">
                        tag
                    </span>
                    {tag.map((b, i) => (
                        <span
                            key={`tag-${i}`}
                            title="GCM authentication tag — covers every byte above"
                            className="px-1.5 py-1 rounded bg-base-100/40 text-base-content/40 cursor-not-allowed"
                        >
                            {toHexByte(b)}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-base-content/50">
                        {count === 0
                            ? 'untouched — click bytes to tamper'
                            : `${count} byte${count === 1 ? '' : 's'} tampered`}
                    </span>
                    {count > 0 && (
                        <button
                            type="button"
                            className="btn btn-xs btn-ghost"
                            onClick={onResetTamper}
                        >
                            Restore original
                        </button>
                    )}
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div
                    className={`rounded-lg border p-3 space-y-1 transition-colors ${
                        gcmRejected
                            ? 'border-error/40 bg-error/10'
                            : 'border-success/40 bg-success/10'
                    }`}
                >
                    <div
                        className={`flex items-center gap-2 font-semibold text-sm ${
                            gcmRejected ? 'text-error' : 'text-success'
                        }`}
                    >
                        {gcmRejected ? (
                            <>
                                <FiXCircle className="w-4 h-4 shrink-0" />
                                AES-GCM · rejected
                            </>
                        ) : (
                            <>
                                <FiCheckCircle className="w-4 h-4 shrink-0" />
                                AES-GCM · verified
                            </>
                        )}
                    </div>
                    {gcmRejected ? (
                        <p className="text-xs text-base-content/70">
                            The auth tag no longer matches the altered bytes, so decryption refuses.
                            You never see forged data.
                        </p>
                    ) : (
                        <code className="text-xs break-all block">{originalPlaintext}</code>
                    )}
                </div>

                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-sm text-warning">
                        <FiShieldOff className="w-4 h-4 shrink-0" />
                        AES-CTR · no auth tag
                    </div>
                    <code className="text-xs break-all block">
                        <CorruptedText text={ctrPlaintext} original={originalPlaintext} />
                    </code>
                    <p className="text-xs text-base-content/60">
                        {count > 0
                            ? 'Same keystream, no authentication — it just hands back the corrupted message. An attacker could make targeted edits and you’d never know.'
                            : 'With nothing tampered it returns the message — identical to GCM.'}
                    </p>
                </div>
            </div>

            <p className="text-xs text-base-content/70 mt-3">
                <span className="font-semibold">GCM = AES-CTR + an authentication tag.</span>{' '}
                Identical encryption underneath; the tag is the only reason GCM catches the change
                CTR waves through.
            </p>
        </div>
    );
}

export default IntegrityCheck;
