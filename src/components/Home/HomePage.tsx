// src/components/Home/HomePage.tsx

import React, { useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { motion } from 'motion/react';
import { useHome } from '@/hooks/useHome';
import { Section } from '@/types';

// Import our section components
import HeroSection from './sections/HeroSection';
import NavigationSection from './sections/NavigationSection';
import ContentSection from './sections/ContentSection';

const Home: React.FC = () => {
  const {
    currentSection,
    sectionRefs,
    animationStates,
    scrollProgress,
    scrollToSection
  } = useHome();

  const renderCount = useRef(0);
  renderCount.current++;

  console.group(`HomePage Render #${renderCount.current}`);

  // Memoize the section state logging
  const logSectionState = useCallback(() => {
    console.log('Section state update:', {
      current: currentSection,
      states: Object.entries(animationStates).map(([key, value]) => ({
        section: key,
        visible: value.isVisible,
        progress: value.progress
      }))
    });
  }, [currentSection, animationStates]);

  useEffect(() => {
    logSectionState();
  }, [currentSection, animationStates, logSectionState]);

  // Memoize section variants to prevent recreating on every render
  const sectionVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  }), []);

  // Wrap section components in useCallback to prevent unnecessary re-renders
  const renderHeroSection = useCallback(() => (
    <HeroSection 
      isVisible={animationStates.hero.isVisible}
      progress={animationStates.hero.progress}
    />
  ), [animationStates.hero.isVisible, animationStates.hero.progress]);

  const renderNavigationSection = useCallback(() => (
    <NavigationSection 
      isVisible={animationStates.navigation.isVisible}
      progress={animationStates.navigation.progress}
    />
  ), [animationStates.navigation.isVisible, animationStates.navigation.progress]);

  const renderContentSection = useCallback(() => (
    <ContentSection 
      isVisible={animationStates.content.isVisible}
      progress={animationStates.content.progress}
    />
  ), [animationStates.content.isVisible, animationStates.content.progress]);

  console.groupEnd();

  return (
    <div className="relative">
      {/* Quick navigation dots */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4">
        {Object.keys(sectionRefs).map((section) => (
          <button
            key={section}
            onClick={() => scrollToSection(section as Section)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSection === section
                ? 'bg-primary scale-125'
                : 'bg-base-content/20 hover:bg-base-content/40'
            }`}
            aria-label={`Scroll to ${section} section`}
          />
        ))}
      </div>

      <motion.main className="min-h-screen overflow-hidden" initial="hidden" animate="visible" exit="exit">
        {/* Hero Section */}
        <motion.div
          ref={sectionRefs.hero}
          variants={sectionVariants}
          animate={animationStates.hero.isVisible ? "visible" : "hidden"}
          className="section-container"
        >
          {renderHeroSection()}
        </motion.div>

        {/* Navigation Section */}
        <motion.div
          ref={sectionRefs.navigation}
          variants={sectionVariants}
          animate={animationStates.navigation.isVisible ? "visible" : "hidden"}
          className="section-container"
        >
          {renderNavigationSection()}
        </motion.div>

        {/* Content Section */}
        <motion.div
          ref={sectionRefs.content}
          variants={sectionVariants}
          animate={animationStates.content.isVisible ? "visible" : "hidden"}
          className="section-container"
        >
          {renderContentSection()}
        </motion.div>
      </motion.main>

      {/* Background gradient */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 z-0"
        style={{
          background: `
            radial-gradient(
              circle at ${50 + scrollProgress * 20}% ${30 + scrollProgress * 40}%, 
              var(--color-primary) 0%, 
              transparent 60%
            )
          `
        }}
      />
    </div>
  );
};

// Add React.memo to the Home component
export default memo(Home);