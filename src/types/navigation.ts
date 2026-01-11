// Navigation and layout types

import { MotionValue } from 'motion/react';
import { RefObject } from 'react';

// Home page types
export type Section = 'hero' | 'navigation' | 'content';

export interface AnimationState {
    isVisible: boolean;
    hasAnimated: boolean;
    progress: number;
}

export interface UseHomeReturn {
    // Current section information
    currentSection: Section;
    sectionRefs: {
        [K in Section]: RefObject<HTMLDivElement | null>; // Changed from HTMLElement to HTMLDivElement
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

// Layout types
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

// Navbar types
export interface NavbarState {
    // Mobile menu state
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
    // Scroll animation state
    navbarHeight: MotionValue<number>;
    navbarOpacity: MotionValue<number>;
    navbarVisibility: MotionValue<number>;
    showNavbar: () => void;
    // Route-aware navigation
    isHomePage: boolean;
    navigateToSection: (sectionId: string) => void;
    // Active section tracking
    activeSection: string | null;
    scrollProgress: number;
    // Hover states
    hoveredItem: string | null;
    setHoveredItem: (item: string | null) => void;
    isLogoHovered: boolean;
    setIsLogoHovered: (hovered: boolean) => void;
    // Pull tab state
    pullTabHintShown: boolean;
    setPullTabHintShown: (shown: boolean) => void;
}

export interface NavButtonProps {
    label: string;
    isActive: boolean;
    isHovered: boolean;
    onClick: () => void;
    onHoverStart: () => void;
    onHoverEnd: () => void;
}
