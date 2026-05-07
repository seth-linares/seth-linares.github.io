// src/components/AnimatedCats.tsx
//
// Wandering pixel cats overlay. All simulation logic lives in useAnimatedCats; this
// component just renders an absolutely-positioned div per cat. The hook mutates each
// cat's `transform` directly via the ref, so React re-renders only on pose changes.

import { useAnimatedCats } from '@/hooks/useAnimatedCats';
import { CAT_PALETTES } from '@/types/pixel-cat';
import PixelCat from './PixelCat';

interface Props {
    count?: number;
    catSize?: number;
    opacity?: number;
}

function AnimatedCats({ count = 4, catSize = 56, opacity = 0.85 }: Props) {
    const { poses, palettes, catRefs, enabled } = useAnimatedCats({ count, catSize });

    if (!enabled) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-10" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        catRefs.current[i] = el;
                    }}
                    className="absolute top-0 left-0 will-change-transform"
                    style={{ opacity }}
                >
                    <PixelCat
                        pose={poses[i] ?? 'idle'}
                        palette={palettes[i] ?? CAT_PALETTES.orange}
                        size={catSize}
                    />
                </div>
            ))}
        </div>
    );
}

export default AnimatedCats;
