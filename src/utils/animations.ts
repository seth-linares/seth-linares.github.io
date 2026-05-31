// src/utils/animations.ts
//
// Shared Motion presets. Two flavours, typed separately so they can't be mixed up:
//   - gesture targets (buttonHover / buttonTap) for whileHover / whileTap
//   - entrance variant maps (fadeUp / fadeUpSubtle / scaleIn) used with
//     initial="initial" animate="animate". The transition lives *inside* the animate
//     target so it actually applies when resolved as a variant (a sibling-level
//     `transition` is treated as a variant label and silently ignored).

import type { TargetAndTransition, Variants } from 'motion/react';

export const buttonHover = {
    scale: 1.05,
    transition: { duration: 0.2, ease: 'easeOut' },
} satisfies TargetAndTransition;

export const buttonTap = {
    scale: 0.95,
    transition: { duration: 0.1, ease: 'easeIn' },
} satisfies TargetAndTransition;

export const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
} satisfies Variants;

// Mobile-menu stagger children — keys match the parent container's open/closed labels so
// they inherit its staggered transition (a plain initial/animate child silently ignores
// the parent's stagger and never animates in).
export const mobileMenuItem = {
    closed: { opacity: 0, y: 10 },
    open: { opacity: 1, y: 0 },
} satisfies Variants;

export const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
} satisfies Variants;

// Stagger timings (seconds) for variant propagation.
export const STAGGER = {
    normal: 0.1,
    micro: 0.05,
} as const;
