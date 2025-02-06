// src/hooks/usePageTransition.ts

import { useCallback, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAnimate, AnimationScope } from 'motion/react'

interface PageTransitionState {
  // The current transition state of the page
  isTransitioning: boolean
  // Reference for AnimatePresence to trigger exit animations
  exitBeforeEnter: boolean
  // Animation scope and controls for coordinating transitions
  scope: AnimationScope
  // Methods to trigger transitions
  startTransition: () => Promise<void>
  completeTransition: () => void
}

function usePageTransition(): PageTransitionState {
  // Create our animation scope and controls using useAnimate
  const [scope, animate] = useAnimate()
  
  // Track transition state
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [exitBeforeEnter, setExitBeforeEnter] = useState(true)
  
  // Get current location for tracking route changes
  const location = useLocation()

  // Define our animation sequence
  const startTransition = useCallback(async () => {
    try {
      setIsTransitioning(true)
      
      // Use a stagger effect for smoother transitions
      await animate('main', 
        { opacity: 0, y: 20 },
        { duration: 0.2, ease: [0.45, 0, 0.55, 1] }
      )
      
      await animate('main',
        { y: 50 },
        { duration: 0, ease: 'easeOut' }
      )
      
      await animate('main',
        { opacity: 1, y: 0 },
        { duration: 0.3, ease: [0.45, 0, 0.55, 1] }
      )
    } catch (error) {
      console.error('Transition failed:', error)
    } finally {
      setIsTransitioning(false)
    }
  }, [animate])

  // Handle completion of transitions
  const completeTransition = useCallback(() => {
    setIsTransitioning(false)
    setExitBeforeEnter(true)
  }, [])

  // Start transition when route changes
  useEffect(() => {
    startTransition()
  }, [location.pathname, startTransition])

  // Cleanup animations when component unmounts
  useEffect(() => {
    const currentScope = scope.current
    return () => {
      if (currentScope) {
        void animate(currentScope, { opacity: 1, y: 0 })
      }
    }
  }, [animate, scope])

  return {
    isTransitioning,
    exitBeforeEnter,
    scope,
    startTransition,
    completeTransition
  }
};

export default usePageTransition;