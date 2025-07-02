// Animation constants and utilities for consistent animations across components

import { Transition } from "motion/react";

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
  },

  // Card entry animation optimized for viewport detection
  cardEntry: {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  },

  // Card hover animation for consistent interactive feedback
  cardHover: {
    y: -4,
    transition: {
      duration: 0.2
    }
  },

  // Container animation for staggered card animations
  cardContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  // Individual card item for staggered container animations
  cardItem: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  },

  // For buttons and interactive elements
  buttonHover: {
    scale: 1.05,
    transition: { duration: 0.2, ease: "easeOut" } as Transition
  },
  buttonTap: {
    scale: 0.95,
    transition: { duration: 0.1, ease: "easeIn" } as Transition
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

// Optimized viewport configuration for card animations (prevents flickering)
export const CARD_VIEWPORT_CONFIG = {
  once: true,      // Prevents re-triggering when scrolling back
  amount: 0.2,     // Triggers when 20% of card is visible
  margin: "-50px"  // Start animation 50px before entering viewport
};

// Type for animation variants that may have different transition structures
type AnimationVariant = {
  initial?: object;
  animate?: object | { transition?: object };
  transition?: object;
  [key: string]: unknown;
};

// Animation variants with delay support
export const createAnimationWithDelay = (
  variant: keyof typeof ANIMATION_VARIANTS,
  delay: number
) => {
  const baseVariant = ANIMATION_VARIANTS[variant] as AnimationVariant;
  
  // Handle new card variants with nested transition
  if (baseVariant.animate && typeof baseVariant.animate === 'object' && 
      'transition' in baseVariant.animate && baseVariant.animate.transition) {
    const animateObj = baseVariant.animate as { transition: object };
    return {
      ...baseVariant,
      animate: {
        ...animateObj,
        transition: {
          ...animateObj.transition,
          delay
        }
      }
    };
  }
  
  // Handle traditional variants with top-level transition
  if (baseVariant.transition) {
    const transitionObj = baseVariant.transition as object;
    return {
      ...baseVariant,
      transition: {
        ...transitionObj,
        delay
      }
    };
  }
  
  // Fallback for variants without transitions
  return baseVariant;
};

// Simplified utility for consistent animation prop patterns
export const getAnimationProps = (
  variant: keyof typeof ANIMATION_VARIANTS, 
  delay?: number,
  viewport = CARD_VIEWPORT_CONFIG
) => {
  const baseVariant = ANIMATION_VARIANTS[variant] as AnimationVariant;
  
  if (!delay) {
    return {
      initial: baseVariant.initial,
      whileInView: baseVariant.animate,
      transition: baseVariant.transition,
      viewport
    };
  }

  return {
    initial: baseVariant.initial,
    whileInView: {
      ...baseVariant.animate,
      transition: {
        ...baseVariant.transition,
        delay
      }
    },
    viewport
  };
};