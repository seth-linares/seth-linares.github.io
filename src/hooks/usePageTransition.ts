// src/hooks/usePageTransition.ts

import { useCallback, useState, useEffect } from 'react'
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
  
  // Get current location for tracking route changes (unused but kept for future use)
  // const location = useLocation()

  // Simplified animation sequence - no longer competing with AnimatePresence
  const startTransition = useCallback(async () => {
    try {
      setIsTransitioning(true)
      
      // Simple fade transition that doesn't interfere with component animations
      await animate('main', 
        { opacity: 0.8 },
        { duration: 0.15, ease: 'easeOut' }
      )
      
      await animate('main',
        { opacity: 1 },
        { duration: 0.15, ease: 'easeIn' }
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

  // Remove automatic transition triggering - let AnimatePresence handle it
  // useEffect(() => {
  //   startTransition()
  // }, [location.pathname, startTransition])

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