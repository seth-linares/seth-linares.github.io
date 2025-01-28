// src/hooks/useHome.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { AnimationState, Section, UseHomeReturn } from '../types';
import { useDebounceRAF } from './useDebounce';

export function useHome(): UseHomeReturn {
  console.group('useHome Hook');
  console.log('Hook initialized');

  // Track the currently visible section
  const [currentSection, setCurrentSection] = useState<Section>('hero');
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Create refs first
  const heroRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Create the refs object
  const sectionRefs = useMemo(() => ({
    hero: heroRef,
    navigation: navigationRef,
    content: contentRef,
  }), []); // Empty dependency array as refs are stable
  
  // Animation states for each section
  const [animationStates, setAnimationStates] = useState<{
    [K in Section]: AnimationState;
  }>({
    hero: { isVisible: true, hasAnimated: false, progress: 0 },
    navigation: { isVisible: false, hasAnimated: false, progress: 0 },
    content: { isVisible: false, hasAnimated: false, progress: 0 },
  });

  // Handle scroll events with RAF and batched updates
  const handleScroll = useDebounceRAF(() => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Calculate all values first
    const progress = Math.min(scrollY / (documentHeight - windowHeight), 1);
    const newAnimationStates = { ...animationStates };
    
    Object.entries(sectionRefs).forEach(([section, ref]) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const isVisible = rect.top < windowHeight && rect.bottom > 0;
        const sectionProgress = Math.max(0, Math.min((windowHeight - rect.top) / windowHeight, 1));
        
        newAnimationStates[section as Section] = {
          ...newAnimationStates[section as Section],
          isVisible,
          progress: sectionProgress,
        };
      }
    });

    // Batch updates
    ReactDOM.unstable_batchedUpdates(() => {
      setScrollProgress(progress);
      setAnimationStates(newAnimationStates);
    });
  });

  // Set up intersection observer
  useEffect(() => {
    console.group('Observer Effect');
    console.log('Setting up intersection observer');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = Object.entries(sectionRefs).find(
            ([, ref]) => ref.current === entry.target
          )?.[0] as Section | undefined;

          if (section && entry.isIntersecting) {
            setCurrentSection(section);
            setAnimationStates(prev => ({
              ...prev,
              [section]: {
                ...prev[section],
                hasAnimated: true,
              },
            }));
          }
        });
      },
      { threshold: 0.5 }
    );

    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      console.log('Cleaning up observer');
      console.groupEnd();
      observer.disconnect();
    };
  }, [sectionRefs]); // Include sectionRefs as it's now stable

  // Update scroll listener effect
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Log section changes
  useEffect(() => {
    console.group('Section Change');
    console.log('Current section:', currentSection);
    console.log('Animation states:', animationStates);
    console.groupEnd();
  }, [currentSection, animationStates]);

  // Scroll to section
  const scrollToSection = useCallback((section: Section) => {
    sectionRefs[section].current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [sectionRefs]); // Include sectionRefs as it's now stable

  console.groupEnd();
  return {
    currentSection,
    sectionRefs,
    animationStates,
    scrollProgress,
    scrollToSection,
  };
}