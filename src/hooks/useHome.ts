// src/hooks/useHome.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimationState, Section, UseHomeReturn } from '../types';

export function useHome(): UseHomeReturn {
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

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const progress = Math.min(scrollY / (documentHeight - windowHeight), 1);
    setScrollProgress(progress);
    
    Object.entries(sectionRefs).forEach(([section, ref]) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const isVisible = rect.top < windowHeight && rect.bottom > 0;
        
        setAnimationStates(prev => ({
          ...prev,
          [section]: {
            ...prev[section as Section],
            isVisible,
            progress: Math.max(0, Math.min((windowHeight - rect.top) / windowHeight, 1)),
          },
        }));
      }
    });
  }, [sectionRefs]); // Include sectionRefs as it's now stable

  // Set up intersection observer
  useEffect(() => {
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

    return () => observer.disconnect();
  }, [sectionRefs]); // Include sectionRefs as it's now stable

  // Set up scroll listener
  useEffect(() => {
    let ticking = false;
    
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener);
    return () => window.removeEventListener('scroll', scrollListener);
  }, [handleScroll]);

  // Scroll to section
  const scrollToSection = useCallback((section: Section) => {
    sectionRefs[section].current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [sectionRefs]); // Include sectionRefs as it's now stable

  return {
    currentSection,
    sectionRefs,
    animationStates,
    scrollProgress,
    scrollToSection,
  };
}