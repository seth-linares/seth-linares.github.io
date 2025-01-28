// src/types.ts

import { RefObject } from "react";


/************
  Home Types
*************/

// Define our section types
export type Section = 'hero' | 'navigation' | 'content';

// Interface for animation states
export interface AnimationState {
  isVisible: boolean;
  hasAnimated: boolean;
  progress: number;
}

// Interface for our hook's return value
export interface UseHomeReturn {
  // Current section information
  currentSection: Section;
  sectionRefs: {
    [K in Section]: RefObject<HTMLDivElement>; // Changed from HTMLElement to HTMLDivElement
  };
  
  // Animation states for each section
  animationStates: {
    [K in Section]: AnimationState;
  };
  
  // Scroll progress
  scrollProgress: number;
  
  // Methods
  scrollToSection: (section: Section) => void;
}




/************
  Layout Types
*************/

export interface NavigationItem {
    path: string;
    label: string;
    icon?: string;
}

export interface UseLayoutReturn {
    // Navigation state
    isNavOpen: boolean;
    currentPath: string;
    navigationItems: NavigationItem[];

    // Scroll state
    isScrolled: boolean;
    scrollProgress: number;

    // Animation states
    isPageTransitioning: boolean;

    // Methods
    toggleNav: () => void;
    closeNav: () => void;
    navigateToPage: (path: string) => void;
}