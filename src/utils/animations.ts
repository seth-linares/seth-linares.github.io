// src/utils/animations.ts

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
  },

  // NAVBAR SPECIFIC ANIMATIONS
  navbarShow: {
    initial: { y: "-100%" },
    animate: { y: 0 },
    exit: { y: "-100%" },
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    }
  },

  navbarHide: {
    initial: { y: 0 },
    animate: { y: "-100%" },
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    }
  },

  navButtonActive: {
    scale: 1,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    transition: { duration: 0.2 }
  },

  navButtonInactive: {
    scale: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transition: { duration: 0.2 }
  },

  pullTabBounce: {
    animate: {
      y: [0, -4, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  },

  mobileMenuOpen: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: {
      height: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
      opacity: { duration: 0.2, ease: "easeOut" }
    }
  },

  mobileMenuItems: {
    closed: {
      transition: { 
        staggerChildren: 0.05, 
        staggerDirection: -1 
      }
    },
    open: {
      transition: { 
        staggerChildren: 0.1, 
        delayChildren: 0.1 
      }
    }
  }
};

// Animation timing constants
export const ANIMATION_TIMING = {
  // Base delay between staggered items
  STAGGER_DELAY: 0.1,
  // Maximum delay to prevent excessively long waits
  MAX_DELAY: 1.5,
  // Quick delay for micro-animations
  MICRO_DELAY: 0.05,
  // Navbar-specific timings
  NAVBAR_TRANSITION: 0.3,
  SCROLL_DEBOUNCE: 50
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

// Navbar-specific viewport configuration
export const NAVBAR_VIEWPORT_CONFIG = {
  amount: 0.3,     // Trigger when 30% is visible
  margin: "-80px 0px -20% 0px" // Account for navbar height
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

// Navbar-specific animation helpers
export const getNavbarAnimationProps = (isVisible: boolean) => ({
  initial: false,
  animate: isVisible ? "visible" : "hidden",
  variants: {
    visible: ANIMATION_VARIANTS.navbarShow.animate,
    hidden: ANIMATION_VARIANTS.navbarHide.animate
  },
  transition: ANIMATION_VARIANTS.navbarShow.transition
});

export const getMobileMenuAnimationProps = () => ({
  initial: ANIMATION_VARIANTS.mobileMenuOpen.initial,
  animate: ANIMATION_VARIANTS.mobileMenuOpen.animate,
  exit: ANIMATION_VARIANTS.mobileMenuOpen.exit,
  transition: ANIMATION_VARIANTS.mobileMenuOpen.transition
});