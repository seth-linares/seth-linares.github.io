// src/components/crypto_playground/CopyField.tsx

import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface CopyFieldProps {
    label: string;
    value: string;
    hint?: string;
    headerRight?: React.ReactNode;
}

// A labelled, monospace, copyable byte field (salt / IV / key / ciphertext).
function CopyField({ label, value, hint, headerRight }: CopyFieldProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be unavailable in insecure contexts — fail quietly.
        }
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-base-content/60">
                        {label}
                    </span>
                    {hint && <span className="text-xs text-base-content/40">{hint}</span>}
                </div>
                {headerRight}
            </div>
            <div className="flex items-stretch gap-2">
                <code className="flex-1 bg-base-300 rounded-md px-3 py-2 text-xs font-mono break-all leading-relaxed">
                    {value}
                </code>
                <button
                    type="button"
                    onClick={handleCopy}
                    className={`btn btn-sm btn-square ${copied ? 'btn-success' : 'btn-ghost'}`}
                    title={`Copy ${label}`}
                    aria-label={`Copy ${label}`}
                >
                    {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

export default CopyField;
