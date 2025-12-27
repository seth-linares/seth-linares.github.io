// src/hooks/useNavbar.ts

import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  useScroll, 
  useSpring, 
  useTransform, 
  useVelocity, 
  useMotionValue, 
} from 'motion/react'
import { NavbarState } from '@/types/navigation'

// Configuration constants
const NAVBAR_CONFIG = {
  SCROLL_THRESHOLD: 100,
  VELOCITY_THRESHOLD: 300,
  DEBOUNCE_DELAY: 50,
  OBSERVER_THRESHOLD: [0, 0.25, 0.5, 0.75, 1],
  OBSERVER_ROOT_MARGIN: '-80px 0px -20% 0px',
  SECTIONS: ['about', 'experience', 'projects', 'tools', 'contact'] as const
}

export function useNavbar(): NavbarState {
  const location = useLocation()
  const navigate = useNavigate()
  const isHomePage = location.pathname === '/'

  // Core state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isLogoHovered, setIsLogoHovered] = useState(false)
  const [pullTabHintShown, setPullTabHintShown] = useState(false)
  const [isManuallyShown, setIsManuallyShown] = useState(false)

  // Refs for managing state without causing re-renders
  const lastScrollY = useRef(0)
  const scrollDirection = useRef<'up' | 'down' | null>(null)
  const sectionObserver = useRef<IntersectionObserver | null>(null)
  const visibleSections = useRef<Map<string, number>>(new Map())
  const [prevPathname, setPrevPathname] = useState(location.pathname)

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
    [0, 0.05],
    [1, 0.9]
  )
  
  const navbarHeight = useTransform(
    smoothScrollProgress,
    [0, 0.05],
    [80, 64]
  )

  // Mobile menu handlers
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Simplified navbar visibility logic
  const updateNavbarVisibility = useCallback(() => {
    const currentScrollY = scrollY.get()
    const velocity = scrollVelocity.get()
    const delta = currentScrollY - lastScrollY.current
    
    // Update scroll direction
    if (Math.abs(delta) > 5) {
      scrollDirection.current = delta > 0 ? 'down' : 'up'
    }
    
    // Always show navbar at top
    if (currentScrollY < NAVBAR_CONFIG.SCROLL_THRESHOLD) {
      rawNavbarVisibility.set(1)
      setIsManuallyShown(false)
      lastScrollY.current = currentScrollY
      return
    }
    
    // If manually shown, keep visible until significant scroll down
    if (isManuallyShown) {
      if (velocity > NAVBAR_CONFIG.VELOCITY_THRESHOLD && scrollDirection.current === 'down') {
        setIsManuallyShown(false)
        rawNavbarVisibility.set(0)
      }
      lastScrollY.current = currentScrollY
      return
    }
    
    // Normal scroll behavior
    if (Math.abs(velocity) > NAVBAR_CONFIG.VELOCITY_THRESHOLD) {
      const shouldShow = scrollDirection.current === 'up'
      rawNavbarVisibility.set(shouldShow ? 1 : 0)
    }
    
    lastScrollY.current = currentScrollY
  }, [scrollY, scrollVelocity, rawNavbarVisibility, isManuallyShown])

  // Show navbar manually (from pull tab)
  const showNavbar = useCallback(() => {
    setIsManuallyShown(true)
    rawNavbarVisibility.set(1)
  }, [rawNavbarVisibility])

  // Simplified section detection
  const updateActiveSection = useCallback(() => {
    if (!isHomePage) return

    // Check if we're at the bottom of the page - if so, contact section is active
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const isAtBottom = scrollTop + windowHeight >= documentHeight - 50 // 50px threshold

    if (isAtBottom) {
      setActiveSection('contact')
      return
    }

    // Find the section with the highest visibility ratio
    let maxRatio = 0
    let activeSectionId: string | null = null

    visibleSections.current.forEach((ratio, sectionId) => {
      if (ratio > maxRatio) {
        maxRatio = ratio
        activeSectionId = sectionId
      }
    })

    // Only update if we have a clear winner
    if (activeSectionId && maxRatio > 0.3) {
      setActiveSection(activeSectionId)
    }
  }, [isHomePage])

  // Setup Intersection Observer
  const setupSectionObserver = useCallback(() => {
    if (!isHomePage || sectionObserver.current) return
    
    sectionObserver.current = new IntersectionObserver(
      (entries) => {
        // Check if at bottom of page first - skip intersection logic if so
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        const windowHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        if (scrollTop + windowHeight >= documentHeight - 50) {
          setActiveSection('contact')
          return
        }

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleSections.current.set(entry.target.id, entry.intersectionRatio)
          } else {
            visibleSections.current.delete(entry.target.id)
          }
        })

        updateActiveSection()
      },
      {
        threshold: NAVBAR_CONFIG.OBSERVER_THRESHOLD,
        rootMargin: NAVBAR_CONFIG.OBSERVER_ROOT_MARGIN
      }
    )
    
    // Observe all sections
    NAVBAR_CONFIG.SECTIONS.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element && sectionObserver.current) {
        sectionObserver.current.observe(element)
      }
    })
  }, [isHomePage, updateActiveSection])

  // Cleanup observer
  const cleanupSectionObserver = useCallback(() => {
    if (sectionObserver.current) {
      sectionObserver.current.disconnect()
      sectionObserver.current = null
    }
    visibleSections.current.clear()
  }, [])

  // Navigation handler
  const navigateToSection = useCallback((sectionId: string) => {
    if (isHomePage) {
      // Temporarily disable observer updates
      cleanupSectionObserver()
      
      // Set active section immediately for visual feedback
      setActiveSection(sectionId)
      
      // Scroll to section
      const element = document.getElementById(sectionId)
      if (element) {
        const yOffset = -100 // Account for navbar height
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
      
      // Re-enable observer after animation
      setTimeout(() => {
        setupSectionObserver()
      }, 1000)
    } else {
      // Navigate to home page with scroll target
      navigate('/', { state: { scrollTo: sectionId } })
    }
    
    closeMobileMenu()
  }, [isHomePage, navigate, closeMobileMenu, cleanupSectionObserver, setupSectionObserver])

  // Handle navigation from other pages
  useEffect(() => {
    if (isHomePage && location.state?.scrollTo) {
      const targetSection = location.state.scrollTo
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        navigateToSection(targetSection)
      }, 100)
      
      // Clear the state to prevent re-scrolling
      window.history.replaceState({}, document.title)
    }
  }, [isHomePage, location.state, navigateToSection])

  // Debounced scroll handler
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        updateNavbarVisibility()
        updateActiveSection()
      }, NAVBAR_CONFIG.DEBOUNCE_DELAY)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [updateNavbarVisibility, updateActiveSection])

  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    if (isMobileMenuOpen) setIsMobileMenuOpen(false)
  }

  // Setup section observer
  useEffect(() => {
    if (isHomePage) {
      const timer = setTimeout(setupSectionObserver, 100)
      return () => {
        clearTimeout(timer)
        cleanupSectionObserver()
      }
    } else {
      cleanupSectionObserver()
    }
  }, [isHomePage, setupSectionObserver, cleanupSectionObserver])

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
    scrollProgress: smoothScrollProgress.get()
  }
}