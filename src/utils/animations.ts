// Animation constants and utilities for consistent animations across components

export const ANIMATION_VARIANTS = {
  // Standard fade-up animation for section headers and main content
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  },
  
  // Subtle fade-up for secondary content
  fadeUpSubtle: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  },
  
  // Slide from left
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6 }
  },
  
  // Slide from right
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6 }
  },
  
  // Scale animation for interactive elements
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4 }
  }
};

// Animation timing constants
export const ANIMATION_TIMING = {
  // Base delay between staggered items
  STAGGER_DELAY: 0.1,
  // Maximum delay to prevent excessively long waits
  MAX_DELAY: 1.5,
  // Quick delay for micro-animations
  MICRO_DELAY: 0.05
};

// Utility functions for consistent animation patterns
export const createStaggeredDelay = (index: number, baseDelay = 0): number => {
  const calculatedDelay = baseDelay + (index * ANIMATION_TIMING.STAGGER_DELAY);
  return Math.min(calculatedDelay, ANIMATION_TIMING.MAX_DELAY);
};

export const createCompoundDelay = (
  primaryIndex: number, 
  secondaryIndex: number, 
  baseDelay = 0
): number => {
  const primaryDelay = primaryIndex * ANIMATION_TIMING.STAGGER_DELAY;
  const secondaryDelay = secondaryIndex * ANIMATION_TIMING.MICRO_DELAY;
  const totalDelay = baseDelay + primaryDelay + secondaryDelay;
  return Math.min(totalDelay, ANIMATION_TIMING.MAX_DELAY);
};

// Viewport configuration for scroll-triggered animations
export const VIEWPORT_CONFIG = {
  once: true,
  margin: "-10% 0px -10% 0px" // Trigger slightly before element comes into view
};

// Animation variants with delay support
export const createAnimationWithDelay = (
  variant: keyof typeof ANIMATION_VARIANTS,
  delay: number
) => ({
  ...ANIMATION_VARIANTS[variant],
  transition: {
    ...ANIMATION_VARIANTS[variant].transition,
    delay
  }
});