// src/hooks/useNavbar.ts

import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  useScroll, 
  useSpring, 
  useTransform, 
  useVelocity, 
  useMotionValue, 
  MotionValue
} from 'motion/react'

export interface NavbarState {
    // Mobile menu state
    isMobileMenuOpen: boolean
    toggleMobileMenu: () => void
    closeMobileMenu: () => void
    // Scroll animation state
    navbarHeight: MotionValue<number>
    navbarOpacity: MotionValue<number>
    navbarVisibility: MotionValue<number>
    showNavbar: () => void
    // Route-aware navigation
    isHomePage: boolean
    navigateToSection: (sectionId: string) => void
}

export function useNavbar(): NavbarState {
    const location = useLocation()
    const navigate = useNavigate()
    const isHomePage = location.pathname === '/'

    // Navbar opened manually via chevron
    const [manuallyOpened, setManuallyOpened] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    

    // Scroll animation setup
    const { scrollY, scrollYProgress } = useScroll()
    const scrollVelocity = useVelocity(scrollY)
    const rawNavbarVisibility = useMotionValue(1)
    
    const navbarVisibility = useSpring(rawNavbarVisibility, {
        stiffness: 300,
        damping: 30,
        restDelta: 0.001
    })
    
    const smoothScrollProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })
    
    const navbarOpacity = useTransform(
        smoothScrollProgress,
        [0, 0.1],
        [1, 0.8]
    )
    
    const navbarHeight = useTransform(
        smoothScrollProgress,
        [0, 0.1],
        [80, 64]
    )

    // Mobile menu handlers
    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev)
    }, [])

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false)
    }, [])

    // Scroll handlers
    const handleScrollDirection = useCallback(() => {
        const velocity = scrollVelocity.get()
        const currentScroll = scrollY.get()

        // Reset manually opened state when scrolling starts
        if (manuallyOpened) {
            setManuallyOpened(false)
        }

        // Close mobile menu when scrolling
        if (currentScroll > 100 && isMobileMenuOpen) {
            setIsMobileMenuOpen(false)
        }

        // Don't hide navbar near the top of the page
        if (currentScroll < 150) {
            rawNavbarVisibility.set(1)
            return
        }
        
        // Require significant velocity to trigger hiding/showing
        const velocityThreshold = 100
        
        // If navbar was manually opened, allow it to close on next scroll down
        if (velocity > velocityThreshold && currentScroll > 150) {
            rawNavbarVisibility.set(0)
        } else if (velocity < -velocityThreshold) {
            rawNavbarVisibility.set(1)
        }
    }, [scrollVelocity, scrollY, rawNavbarVisibility, isMobileMenuOpen, manuallyOpened])

    // Add method to show navbar
    const showNavbar = useCallback(() => {
        rawNavbarVisibility.set(1)
        setManuallyOpened(true)
    }, [rawNavbarVisibility])

    // Route-aware navigation handler
    const navigateToSection = useCallback((sectionId: string) => {
        if (isHomePage) {
            // If on home page, scroll to section
            const element = document.getElementById(sectionId)
            element?.scrollIntoView({ behavior: 'smooth' })
        } else {
            // If on other page, navigate to home page with scroll target
            navigate('/', { state: { scrollTo: sectionId } })
        }
        closeMobileMenu()
    }, [isHomePage, navigate, closeMobileMenu])

    // Debounced scroll handler
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastScrollYRef = useRef(0)
    
    const debouncedScrollHandler = useCallback(() => {
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
        }
        
        // Set new timeout for debounced execution
        scrollTimeoutRef.current = setTimeout(() => {
            const currentScrollY = scrollY.get()
            // Only handle if scroll position has actually changed
            if (currentScrollY !== lastScrollYRef.current) {
                handleScrollDirection()
                lastScrollYRef.current = currentScrollY
            }
        }, 10) // 10ms debounce for smooth but performant updates
    }, [handleScrollDirection, scrollY])

    // Effects
    useEffect(() => {
        window.addEventListener('scroll', debouncedScrollHandler, { passive: true })
        return () => {
            window.removeEventListener('scroll', debouncedScrollHandler)
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
        }
    }, [debouncedScrollHandler])

    useEffect(() => {
        setIsMobileMenuOpen(false)
        window.scrollTo(0, 0)
    }, [location.pathname])

    return {
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        navbarHeight,
        navbarOpacity,
        navbarVisibility,
        showNavbar,
        isHomePage,
        navigateToSection
    }
}