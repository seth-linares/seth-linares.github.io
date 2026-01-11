// src/hooks/useNavbar.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useScroll, useSpring, useTransform, useVelocity, useMotionValue } from 'motion/react';
import { NavbarState } from '@/types/navigation';

// Configuration constants
const NAVBAR_CONFIG = {
    SCROLL_THRESHOLD: 100,
    VELOCITY_THRESHOLD: 300,
    DEBOUNCE_DELAY: 50,
    NAVBAR_OFFSET: 120,
    SECTIONS: [
        'about',
        'experience',
        'projects',
        'skills',
        'education',
        'tools',
        'contact',
    ] as const,
};

export function useNavbar(): NavbarState {
    const location = useLocation();
    const navigate = useNavigate();
    const isHomePage = location.pathname === '/';

    // Core state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [isLogoHovered, setIsLogoHovered] = useState(false);
    const [pullTabHintShown, setPullTabHintShown] = useState(false);
    const [isManuallyShown, setIsManuallyShown] = useState(false);

    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const isNavigating = useRef(false);
    const [prevPathname, setPrevPathname] = useState(location.pathname);

    // Scroll animation setup
    const { scrollY, scrollYProgress } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const rawNavbarVisibility = useMotionValue(1);

    const navbarVisibility = useSpring(rawNavbarVisibility, {
        stiffness: 300,
        damping: 30,
        restDelta: 0.001,
    });

    const smoothScrollProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    const navbarOpacity = useTransform(smoothScrollProgress, [0, 0.05], [1, 0.9]);

    const navbarHeight = useTransform(smoothScrollProgress, [0, 0.05], [80, 64]);

    // Mobile menu handlers
    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen((prev) => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    const updateNavbarVisibility = useCallback(() => {
        const currentScrollY = scrollY.get();
        const velocity = scrollVelocity.get();
        const delta = currentScrollY - lastScrollY.current;

        // Update scroll direction
        if (Math.abs(delta) > 5) {
            scrollDirection.current = delta > 0 ? 'down' : 'up';
        }

        // Always show navbar at top
        if (currentScrollY < NAVBAR_CONFIG.SCROLL_THRESHOLD) {
            rawNavbarVisibility.set(1);
            setIsManuallyShown(false);
            lastScrollY.current = currentScrollY;
            return;
        }

        if (isManuallyShown) {
            if (velocity > NAVBAR_CONFIG.VELOCITY_THRESHOLD && scrollDirection.current === 'down') {
                setIsManuallyShown(false);
                rawNavbarVisibility.set(0);
            }
            lastScrollY.current = currentScrollY;
            return;
        }

        // Normal scroll behavior
        if (Math.abs(velocity) > NAVBAR_CONFIG.VELOCITY_THRESHOLD) {
            const shouldShow = scrollDirection.current === 'up';
            rawNavbarVisibility.set(shouldShow ? 1 : 0);
        }

        lastScrollY.current = currentScrollY;
    }, [scrollY, scrollVelocity, rawNavbarVisibility, isManuallyShown]);

    const showNavbar = useCallback(() => {
        setIsManuallyShown(true);
        rawNavbarVisibility.set(1);
    }, [rawNavbarVisibility]);

    const updateActiveSection = useCallback(() => {
        if (!isHomePage || isNavigating.current) return;

        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollTop + windowHeight >= documentHeight - 50) {
            setActiveSection('contact');
            return;
        }

        let closestSection: string | null = null;
        let closestDistance = Infinity;

        NAVBAR_CONFIG.SECTIONS.forEach((sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) {
                const rect = element.getBoundingClientRect();
                const distance = Math.abs(rect.top - NAVBAR_CONFIG.NAVBAR_OFFSET);
                if (rect.top <= NAVBAR_CONFIG.NAVBAR_OFFSET + 100 && distance < closestDistance) {
                    closestDistance = distance;
                    closestSection = sectionId;
                }
            }
        });

        setActiveSection(closestSection);
    }, [isHomePage]);

    // Navigation handler
    const navigateToSection = useCallback(
        (sectionId: string) => {
            if (isHomePage) {
                isNavigating.current = true;
                setActiveSection(sectionId);

                // Scroll to section
                const element = document.getElementById(sectionId);
                if (element) {
                    const yOffset = -100;
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }

                setTimeout(() => {
                    isNavigating.current = false;
                }, 1000);
            } else {
                navigate('/', { state: { scrollTo: sectionId } });
            }

            closeMobileMenu();
        },
        [isHomePage, navigate, closeMobileMenu]
    );

    useEffect(() => {
        if (isHomePage && location.state?.scrollTo) {
            const targetSection = location.state.scrollTo;
            setTimeout(() => {
                navigateToSection(targetSection);
            }, 100);

            window.history.replaceState({}, document.title);
        }
    }, [isHomePage, location.state, navigateToSection]);

    // Debounced scroll handler
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                updateNavbarVisibility();
                updateActiveSection();
            }, NAVBAR_CONFIG.DEBOUNCE_DELAY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [updateNavbarVisibility, updateActiveSection]);

    if (prevPathname !== location.pathname) {
        setPrevPathname(location.pathname);
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }

    return {
        isMobileMenuOpen,
        navbarHeight,
        navbarOpacity,
        navbarVisibility,
        isHomePage,
        activeSection: isHomePage ? activeSection : null,
        hoveredItem,
        isLogoHovered,
        pullTabHintShown,
        toggleMobileMenu,
        closeMobileMenu,
        showNavbar,
        navigateToSection,
        setHoveredItem,
        setIsLogoHovered,
        setPullTabHintShown,
        scrollProgress: smoothScrollProgress.get(),
    };
}
