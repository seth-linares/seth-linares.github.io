// src/components/AnimatedCats.tsx
//
// Wandering pixel cats overlay. All simulation logic lives in useAnimatedCats;
// the drag-to-spawn tray lives in <CatTray />. This component is now the
// orchestrator: it mounts the cats overlay, the speech-bubble overlay, and
// the tray.
//
// Mount this inside a positioned wrapper that has `isolate` (creates a
// stacking context). Two sibling overlays inside the isolate:
//   - cats overlay at `-z-10`: cats sit behind page content (so they walk
//     under [data-cat-obstacle] blocks).
//   - bubbles overlay at `z-10`: speech bubbles sit ABOVE page content, so a
//     hidden cat still announces what it's up to. Tomodachi-style.
// Cats are doc-anchored, so the wrapper must span the full page height (e.g.
// min-h-screen on a homepage root).

import { useAnimatedCats } from '@/hooks/useAnimatedCats';
import { CAT_PALETTES } from '@/types/pixel-cat';
import CatTray from './cats/CatTray';
import PixelCat from './PixelCat';

interface Props {
    count?: number;
    catSize?: number;
    opacity?: number;
}

// Tiny speech-bubble used by the per-cat overlay. Pure presentation. The
// bubble's parent <div> handles translation via the rAF loop; this inner
// element centers itself horizontally over that anchor with -translate-x-1/2.
function CatBubble({ text }: { text: string | null }) {
    if (!text) return null;
    return (
        <div className="relative -translate-x-1/2 inline-block text-base font-pixel leading-none tracking-wide text-base-content/95 bg-base-100/95 backdrop-blur-sm border border-base-300 rounded-md px-2 py-0.5 shadow-md whitespace-nowrap after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-[5px] after:w-2 after:h-2 after:bg-base-100/95 after:border-r after:border-b after:border-base-300 after:rotate-45">
            {text}
        </div>
    );
}

function AnimatedCats({ count = 8, catSize = 56, opacity = 0.85 }: Props) {
    const {
        poses,
        palettes,
        messages,
        catRefs,
        bubbleRefs,
        enabled,
        count: activeCount,
        maxCount,
        spawn,
        removeLast,
        reset,
        isAtInitialCount,
    } = useAnimatedCats({ count, catSize });

    if (!enabled) return null;

    return (
        <>
            <div className="absolute inset-0 pointer-events-none -z-10" aria-hidden="true">
                {Array.from({ length: activeCount }).map((_, i) => (
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

            {/* Speech-bubble overlay. Sibling of the cats overlay but at z-10
                so bubbles render ABOVE [data-cat-obstacle] blocks — a cat
                hidden under the typewriter terminal still gets to "talk".
                The rAF loop writes a translate-only transform to each entry
                per frame; the inner CatBubble handles horizontal centering
                and fades via CSS opacity. aria-hidden because bubbles are
                decorative flavor; the tray's role=status row remains the AT
                announcement surface. */}
            <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
                {Array.from({ length: activeCount }).map((_, i) => (
                    <div
                        key={i}
                        ref={(el) => {
                            bubbleRefs.current[i] = el;
                        }}
                        className="absolute top-0 left-0 will-change-transform transition-opacity duration-200"
                        style={{ opacity: messages[i] ? 1 : 0 }}
                    >
                        <CatBubble text={messages[i] ?? null} />
                    </div>
                ))}
            </div>

            <CatTray
                spawn={spawn}
                removeLast={removeLast}
                reset={reset}
                activeCount={activeCount}
                maxCount={maxCount}
                isAtInitialCount={isAtInitialCount}
                catSize={catSize}
            />
        </>
    );
}

export default AnimatedCats;
