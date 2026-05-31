// src/components/crypto_playground/Argon2Controls.tsx

import { m } from 'motion/react';
import { FiSliders, FiClock } from 'react-icons/fi';
import { Argon2Params } from '@/types/crypto';
import { MEMORY_MIB, ITERATIONS } from '@/utils/crypto/constants';

interface ParamSliderProps {
    label: string;
    description: string;
    display: string;
    value: number;
    min: number;
    max: number;
    step: number;
    disabled: boolean;
    onChange: (value: number) => void;
}

function ParamSlider({
    label,
    description,
    display,
    value,
    min,
    max,
    step,
    disabled,
    onChange,
}: ParamSliderProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{label}</span>
                <span className="badge badge-sm badge-primary badge-outline font-mono">
                    {display}
                </span>
            </div>
            <input
                type="range"
                className="range range-primary range-sm"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
            />
            <p className="text-xs text-base-content/50 mt-1">{description}</p>
        </div>
    );
}

interface Argon2ControlsProps {
    params: Argon2Params;
    setParam: (key: keyof Argon2Params, value: number) => void;
    disabled: boolean;
    derivationMs: number | null;
    deriveSeq: number;
}

function Argon2Controls({
    params,
    setParam,
    disabled,
    derivationMs,
    deriveSeq,
}: Argon2ControlsProps) {
    const memoryMiB = Math.round(params.memoryKiB / 1024);

    return (
        <div className="bg-base-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
                <FiSliders className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Argon2id parameters</h3>
                <span className="text-xs text-base-content/50">
                    — raise the cost, watch the clock
                </span>
            </div>

            <ParamSlider
                label="Memory"
                display={`${memoryMiB} MiB`}
                value={memoryMiB}
                min={MEMORY_MIB.min}
                max={MEMORY_MIB.max}
                step={MEMORY_MIB.step}
                disabled={disabled}
                description="The memory-hardness knob — high cost here is what defeats GPU/ASIC cracking."
                onChange={(v) => setParam('memoryKiB', v * 1024)}
            />
            <ParamSlider
                label="Iterations"
                display={`${params.iterations}×`}
                value={params.iterations}
                min={ITERATIONS.min}
                max={ITERATIONS.max}
                step={ITERATIONS.step}
                disabled={disabled}
                description="Passes over memory — more passes add time cost on top of memory cost."
                onChange={(v) => setParam('iterations', v)}
            />

            {/* Prominent derivation-time readout — the "clock" the controls refer to. */}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-base-100 border border-base-300 px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                    <FiClock className="w-4 h-4 text-primary" />
                    <span className="font-medium">Time to derive the key</span>
                </div>
                {derivationMs === null ? (
                    <span className="text-sm text-base-content/50 font-mono">
                        — encrypt to measure
                    </span>
                ) : (
                    <m.span
                        key={deriveSeq}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                        className="font-mono font-bold text-primary tabular-nums"
                    >
                        <span className="text-3xl">{Math.round(derivationMs)}</span>
                        <span className="text-sm font-medium text-base-content/60"> ms</span>
                    </m.span>
                )}
            </div>

            <p className="text-xs text-base-content/40">
                Argon2 also takes a <span className="font-mono">parallelism</span> (lanes)
                parameter. It&apos;s fixed at 1 here: it only speeds derivation up across multiple
                CPU cores, so single-threaded in the browser it changes the key but never the clock.
            </p>
        </div>
    );
}

export default Argon2Controls;
