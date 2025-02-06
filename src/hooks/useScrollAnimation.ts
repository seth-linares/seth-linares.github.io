// src/hooks/useScrollAnimation.ts

import { useEffect, useCallback, useMemo, useState, useRef } from 'react'
import { 
  useScroll, 
  useSpring, 
  useTransform, 
  useMotionValueEvent,
  MotionValue 
} from 'motion/react'

interface ScrollAnimationState {
  // Smoothed scroll progress for fluid animations
  smoothProgress: MotionValue<number>
  // Values for scroll-linked animations
  contentScale: MotionValue<number>
  contentOpacity: MotionValue<number>
  // Current scroll state
  isScrolling: boolean
  // Methods to handle scroll events
  handleScrollStart: () => void
  handleScrollComplete: () => void
  // Additional animation values
  rotateX: MotionValue<number>
  translateY: MotionValue<number>
  scale: MotionValue<number>
  backgroundColor: MotionValue<string>
}

function useScrollAnimation(): ScrollAnimationState {
  // Get scroll progress information. We specifically want scrollYProgress
  // for percentage-based animations
  const { scrollYProgress } = useScroll()

  // Create a smoothed version of scroll progress for more fluid animations
  const smoothProgress = useSpring(scrollYProgress, {
    // These spring settings create a natural, responsive feel
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Transform smooth progress into visual effects
  // As user scrolls down, content slightly scales up and fades in
  const contentScale = useTransform(
    smoothProgress,
    [0, 0.2], // Input range: start of page to 20% scroll
    [0.98, 1], // Output range: slight scale up
    { clamp: true } // Prevent values outside this range
  )

  const contentOpacity = useTransform(
    smoothProgress,
    [0, 0.1], // Input range: start of page to 10% scroll
    [0.85, 1], // Output range: fade in to full opacity
    { clamp: true }
  )

  // Add new transform values
  const rotateX = useTransform(
    smoothProgress,
    [0, 0.5, 1],
    [0, 180, 360],
    { clamp: false }
  )

  const translateY = useTransform(
    smoothProgress,
    [0, 0.5, 1],
    [0, -50, 0],
    { clamp: false }
  )

  const scale = useTransform(
    smoothProgress,
    [0, 0.5, 1],
    [1, 1.2, 1],
    { clamp: false }
  )

  const backgroundColor = useTransform(
    smoothProgress,
    [0, 0.5, 1],
    ["#121212", "#242424", "#121212"]
  )

  // Track whether we're actively scrolling
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<number | null>(null)

  // Handle scroll start
  const handleScrollStart = useCallback(() => {
    setIsScrolling(true)
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  // Handle scroll end
  const handleScrollComplete = useCallback(() => {
    // Set a timeout to detect when scrolling has stopped
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false)
    }, 150) // Wait 150ms after last scroll event
  }, [])

  // Set up scroll event monitoring using Motion's useMotionValueEvent
  useMotionValueEvent(scrollYProgress, "change", () => {
    handleScrollStart()
    handleScrollComplete()
  })

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Memoize our return values to prevent unnecessary rerenders
  return useMemo(() => ({
    smoothProgress,
    contentScale,
    contentOpacity,
    isScrolling,
    handleScrollStart,
    handleScrollComplete,
    rotateX,
    translateY,
    scale,
    backgroundColor
  }), [
    smoothProgress,
    contentScale,
    contentOpacity,
    isScrolling,
    handleScrollStart,
    handleScrollComplete,
    rotateX,
    translateY,
    scale,
    backgroundColor
  ])
}

export default useScrollAnimation;