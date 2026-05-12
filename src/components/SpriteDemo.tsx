// src/components/SpriteDemo.tsx
//
// Unlinked preview route at /sprite-demo. Shows every CatPose with its name, animates
// the walk/run/sleep cycles, and lets you switch palettes. Used to visually review
// new pose grids before wiring them into the cat state machine.

import { useEffect, useState } from 'react';
import PixelCat from './PixelCat';
import { CAT_PALETTES, type CatPalette, type CatPose } from '@/types/pixel-cat';

const STATIC_POSES: { pose: CatPose; isNew?: boolean }[] = [
    { pose: 'idle' },
    { pose: 'sit' },
    { pose: 'loaf', isNew: true },
];

const WALK_CYCLE: CatPose[] = ['walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5'];
const RUN_CYCLE: CatPose[] = ['run0', 'run1', 'run2', 'run3', 'run4', 'run5'];
const SLEEP_CYCLE: CatPose[] = ['sleep0', 'sleep1'];

function useFrameCycle(frames: CatPose[], intervalMs: number): CatPose {
    const [i, setI] = useState(0);
    useEffect(() => {
        const id = window.setInterval(
            () => setI((n) => (n + 1) % frames.length),
            intervalMs,
        );
        return () => window.clearInterval(id);
    }, [frames.length, intervalMs]);
    return frames[i];
}

interface PoseCardProps {
    pose: CatPose;
    palette: CatPalette;
    size?: number;
    isNew?: boolean;
}

function PoseCard({ pose, palette, size = 96, isNew }: PoseCardProps) {
    return (
        <div
            className={`flex flex-col items-center gap-2 p-3 rounded border ${
                isNew ? 'border-primary bg-primary/5' : 'border-base-300'
            }`}
        >
            <PixelCat pose={pose} palette={palette} size={size} />
            <span className="text-xs font-mono opacity-70">{pose}</span>
            {isNew && <span className="badge badge-primary badge-sm">new</span>}
        </div>
    );
}

interface AnimatedPreviewProps {
    frames: CatPose[];
    palette: CatPalette;
    intervalMs: number;
    label: string;
    size?: number;
    isNew?: boolean;
}

function AnimatedPreview({
    frames,
    palette,
    intervalMs,
    label,
    size = 128,
    isNew,
}: AnimatedPreviewProps) {
    const pose = useFrameCycle(frames, intervalMs);
    return (
        <div
            className={`flex flex-col items-center gap-2 p-4 rounded border ${
                isNew ? 'border-primary bg-primary/5' : 'border-base-300'
            }`}
        >
            <PixelCat pose={pose} palette={palette} size={size} />
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs font-mono opacity-60">
                {intervalMs}ms · current: {pose}
            </span>
            {isNew && <span className="badge badge-primary badge-sm">new</span>}
        </div>
    );
}

export default function SpriteDemo() {
    const [paletteName, setPaletteName] = useState<keyof typeof CAT_PALETTES>('orange');
    const [walkSpeed, setWalkSpeed] = useState(120);
    const [runSpeed, setRunSpeed] = useState(70);
    const [sleepSpeed, setSleepSpeed] = useState(1100);
    const palette = CAT_PALETTES[paletteName] ?? CAT_PALETTES.orange;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-2">Sprite Demo</h1>
            <p className="opacity-70 mb-6">
                Preview every <code>CatPose</code> with the palette of your choice. Newly
                added poses are highlighted. Animation cycles auto-play; adjust their speed
                with the sliders below.
            </p>

            <div className="card bg-base-200 p-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <label className="form-control">
                        <span className="label-text text-sm font-semibold">Palette</span>
                        <select
                            value={paletteName}
                            onChange={(e) =>
                                setPaletteName(
                                    e.target.value as keyof typeof CAT_PALETTES,
                                )
                            }
                            className="select select-bordered select-sm"
                        >
                            {Object.keys(CAT_PALETTES).map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="form-control">
                        <span className="label-text text-sm font-semibold">
                            Walk speed ({walkSpeed}ms)
                        </span>
                        <input
                            type="range"
                            min={50}
                            max={400}
                            step={10}
                            value={walkSpeed}
                            onChange={(e) => setWalkSpeed(Number(e.target.value))}
                            className="range range-sm range-primary"
                        />
                    </label>

                    <label className="form-control">
                        <span className="label-text text-sm font-semibold">
                            Run speed ({runSpeed}ms)
                        </span>
                        <input
                            type="range"
                            min={30}
                            max={300}
                            step={10}
                            value={runSpeed}
                            onChange={(e) => setRunSpeed(Number(e.target.value))}
                            className="range range-sm range-primary"
                        />
                    </label>

                    <label className="form-control">
                        <span className="label-text text-sm font-semibold">
                            Sleep breath ({sleepSpeed}ms)
                        </span>
                        <input
                            type="range"
                            min={300}
                            max={2500}
                            step={50}
                            value={sleepSpeed}
                            onChange={(e) => setSleepSpeed(Number(e.target.value))}
                            className="range range-sm range-primary"
                        />
                    </label>
                </div>
            </div>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Animation cycles</h2>
                <div className="flex flex-wrap gap-4">
                    <AnimatedPreview
                        frames={WALK_CYCLE}
                        palette={palette}
                        intervalMs={walkSpeed}
                        label="Walk cycle"
                    />
                    <AnimatedPreview
                        frames={RUN_CYCLE}
                        palette={palette}
                        intervalMs={runSpeed}
                        label="Run cycle"
                    />
                    <AnimatedPreview
                        frames={SLEEP_CYCLE}
                        palette={palette}
                        intervalMs={sleepSpeed}
                        label="Sleep breath"
                        isNew
                    />
                </div>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Static poses</h2>
                <div className="flex flex-wrap gap-3">
                    {STATIC_POSES.map(({ pose, isNew }) => (
                        <PoseCard
                            key={pose}
                            pose={pose}
                            palette={palette}
                            isNew={isNew}
                        />
                    ))}
                </div>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Walk frames</h2>
                <div className="flex flex-wrap gap-3">
                    {WALK_CYCLE.map((p) => (
                        <PoseCard key={p} pose={p} palette={palette} />
                    ))}
                </div>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Run frames</h2>
                <div className="flex flex-wrap gap-3">
                    {RUN_CYCLE.map((p) => (
                        <PoseCard key={p} pose={p} palette={palette} />
                    ))}
                </div>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Sleep frames</h2>
                <div className="flex flex-wrap gap-3">
                    {SLEEP_CYCLE.map((p) => (
                        <PoseCard
                            key={p}
                            pose={p}
                            palette={palette}
                            size={128}
                            isNew
                        />
                    ))}
                </div>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">All palettes</h2>
                <p className="text-sm opacity-70 mb-3">
                    The loaf pose rendered with every available palette.
                </p>
                <div className="flex flex-wrap gap-3">
                    {Object.entries(CAT_PALETTES).map(([name, pal]) => (
                        <div
                            key={name}
                            className="flex flex-col items-center gap-2 p-3 rounded border border-base-300"
                        >
                            <PixelCat pose="loaf" palette={pal} size={96} />
                            <span className="text-xs font-mono opacity-70">{name}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
