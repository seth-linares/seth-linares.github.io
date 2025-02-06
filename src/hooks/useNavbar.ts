// src/hooks/useNavbar.ts

import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
    showNavbar: () => void // Add new method to interface
}

export function useNavbar(): NavbarState {
    const location = useLocation()

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

        if (currentScroll < 100) {
            rawNavbarVisibility.set(1)
            return
        }
        
        // If navbar was manually opened, allow it to close on next scroll down
        if (velocity > 0 && currentScroll > 100) {
            rawNavbarVisibility.set(0)
        } else if (velocity < 0) {
            rawNavbarVisibility.set(1)
        }
    }, [scrollVelocity, scrollY, rawNavbarVisibility, isMobileMenuOpen, manuallyOpened])

    // Add method to show navbar
    const showNavbar = useCallback(() => {
        rawNavbarVisibility.set(1)
        setManuallyOpened(true)
    }, [rawNavbarVisibility])

    // Effects
    useEffect(() => {
        const handleScroll = () => handleScrollDirection()
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [handleScrollDirection])

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
        showNavbar
    }
}