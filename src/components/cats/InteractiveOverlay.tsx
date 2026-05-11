// src/components/cats/InteractiveOverlay.tsx
//
// Third sibling overlay, between the bubble overlay (z-10) and the tray
// (z-30). One per-cat <div> per cat, sized to the sprite, positioned by the
// rAF loop's writeInteractive phase (transform set lockstep with catRefs).
//
// The wrapper has `pointer-events-none` so events anywhere on the overlay's
// empty space fall through to page content. Per-cat divs default to
// `pointer-events-auto` so they intercept pointer events ONLY when over a
// cat — that's where future feature work (petting, hover-info, cat-specific
// click handlers) will attach listeners. Today the divs are empty placeholders.

import type { RefObject } from 'react';

interface Props {
    activeCount: number;
    catSize: number;
    interactiveRefs: RefObject<(HTMLDivElement | null)[]>;
}

function InteractiveOverlay({ activeCount, catSize, interactiveRefs }: Props) {
    return (
        <div className="absolute inset-0 pointer-events-none z-[15]" aria-hidden="true">
            {Array.from({ length: activeCount }).map((_, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        interactiveRefs.current[i] = el;
                    }}
                    className="absolute top-0 left-0 will-change-transform pointer-events-auto"
                    style={{
                        width: catSize,
                        height: catSize,
                    }}
                />
            ))}
        </div>
    );
}

export default InteractiveOverlay;
