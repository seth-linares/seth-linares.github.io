// src/hooks/useHome.ts

import { useState, useRef, useMemo, useCallback } from 'react';
import { useScroll, useSpring, useMotionValueEvent } from 'motion/react';
import { AnimationState, Section, UseHomeReturn } from '@/types';
import { useThrottleRAF } from './useDebounce';

export function useHome(): UseHomeReturn {
  // Track the currently visible section
  const [currentSection, setCurrentSection] = useState<Section>('hero');
  
  // Create refs for sections
  const heroRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Memoize refs object to maintain stable reference
  const sectionRefs = useMemo(() => ({
    hero: heroRef,
    navigation: navigationRef,
    content: contentRef,
  }), []);

  // Initialize animation states
  const [animationStates, setAnimationStates] = useState<{
    [K in Section]: AnimationState;
  }>({
    hero: { isVisible: true, hasAnimated: false, progress: 0 },
    navigation: { isVisible: false, hasAnimated: false, progress: 0 },
    content: { isVisible: false, hasAnimated: false, progress: 0 },
  });

  // Track overall page scroll
  const mainScroll = useScroll({
    offset: ["start start", "end end"]
  });

  // Set up individual section scroll tracking
  const heroScroll = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const navigationScroll = useScroll({
    target: navigationRef,
    offset: ["start end", "end start"]
  });

  const contentScroll = useScroll({
    target: contentRef,
    offset: ["start end", "end start"]
  });

  // Create a smoothed version of the scroll progress
  const smoothProgress = useSpring(mainScroll.scrollYProgress, {
    mass: 0.1,
    stiffness: 100,
    damping: 20
  });

  // Store the current scroll progress value
  const [currentScrollProgress, setCurrentScrollProgress] = useState(0);

  // Add memoization for scroll handlers
  const handleSectionChange = useCallback((value: number) => {
    // Your section change logic
    console.log('Section scroll change:', value);
  }, []);

  // Add throttling to scroll handlers for better performance
  const handleScrollProgress = useThrottleRAF((value: number) => {
    setCurrentScrollProgress(value);
  }, 16); // ~ 60fps

  useMotionValueEvent(smoothProgress, "change", handleScrollProgress);

  useMotionValueEvent(mainScroll.scrollYProgress, "change", handleSectionChange);

  // Update animation states based on scroll position
  useMotionValueEvent(mainScroll.scrollYProgress, "change", () => {
    const sectionScrollValues = {
      hero: heroScroll.scrollYProgress.get(),
      navigation: navigationScroll.scrollYProgress.get(),
      content: contentScroll.scrollYProgress.get()
    };

    setAnimationStates(prevStates => {
      const newStates = { ...prevStates };
      
      (Object.entries(sectionScrollValues) as [Section, number][]).forEach(([section, progress]) => {
        const isVisible = progress > 0 && progress < 1;
        
        newStates[section] = {
          isVisible,
          progress,
          hasAnimated: isVisible || prevStates[section].hasAnimated
        };
      });

      return newStates;
    });

    // Update current section based on visibility
    let maxProgress = -1;
    let visibleSection: Section = currentSection;

    (Object.entries(sectionScrollValues) as [Section, number][]).forEach(([section, progress]) => {
      if (progress > maxProgress && progress > 0 && progress < 1) {
        maxProgress = progress;
        visibleSection = section;
      }
    });

    if (visibleSection !== currentSection) {
      setCurrentSection(visibleSection);
    }
  });

  // Scroll to section with smooth behavior
  const scrollToSection = useCallback((section: Section) => {
    sectionRefs[section].current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [sectionRefs]);

  return {
    currentSection,
    sectionRefs,
    animationStates,
    scrollProgress: currentScrollProgress,
    scrollToSection,
  };
}