// src/components/crypto_playground/EncryptionResult.tsx

import { motion } from 'motion/react';
import { FiClock, FiShield } from 'react-icons/fi';
import { EncryptionView, TamperView } from '@/types/crypto';
import CopyField from './CopyField';
import IntegrityCheck from './IntegrityCheck';

interface EncryptionResultProps {
    view: EncryptionView;
    tamper: TamperView;
    onToggleByte: (index: number) => void;
    onResetTamper: () => void;
}

function EncryptionResult({ view, tamper, onToggleByte, onResetTamper }: EncryptionResultProps) {
    const memoryMiB = Math.round(view.memoryKiB / 1024);

    return (
        <motion.div
            key="encryption-result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="card bg-base-200 shadow-xl mt-6"
        >
            <div className="card-body space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="card-title text-lg flex items-center gap-2">
                        <FiShield className="w-5 h-5 text-success" />
                        Encrypted
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <span className="badge badge-success badge-outline gap-1 font-mono">
                            <FiClock className="w-3 h-3" />
                            Argon2id {Math.round(view.derivationMs)} ms
                        </span>
                        <span className="badge badge-ghost font-mono">
                            {memoryMiB} MiB · {view.iterations}×
                        </span>
                    </div>
                </div>

                <CopyField label="Salt" hint="128-bit · random" value={view.saltHex} />
                <CopyField label="IV / nonce" hint="96-bit · random" value={view.ivHex} />
                <CopyField
                    label="Derived key"
                    hint="256-bit · Argon2id output"
                    value={view.keyHex}
                />

                <IntegrityCheck
                    tamper={tamper}
                    onToggleByte={onToggleByte}
                    onResetTamper={onResetTamper}
                />
            </div>
        </motion.div>
    );
}

export default EncryptionResult;
