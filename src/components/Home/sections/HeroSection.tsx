// src/components/Home/sections/HeroSection.tsx:

import { useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  isVisible: boolean;
  progress: number;
}

// Custom comparison function for the component
const propsAreEqual = (
  prevProps: HeroSectionProps,
  nextProps: HeroSectionProps
): boolean => {
  return (
    prevProps.isVisible === nextProps.isVisible &&
    Math.abs(prevProps.progress - nextProps.progress) < 0.01
  );
};

const HeroSection = memo(({ isVisible, progress }: HeroSectionProps) => {
  const navigate = useNavigate();

  console.group('HeroSection Component');
  console.time('Hero render');
  
  useEffect(() => {
    console.group('Hero Effects');
    console.log('Visibility:', isVisible);
    console.log('Progress:', progress);
    console.groupEnd();
  }, [isVisible, progress]);

  console.timeEnd('Hero render');
  console.groupEnd();

  // Memoize animation variants
  const textVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.8,
        ease: "easeOut"
      }
    })
  }), []);

  const decorationVariants = useMemo(() => ({
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 0.1,
      transition: {
        duration: 1,
        ease: "easeOut"
      }
    }
  }), []);

  // Calculate parallax effect based on scroll progress
  const parallaxY = useMemo(() => 
    progress * -100,
    [progress]
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated circles */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full border border-primary/20"
          variants={decorationVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          style={{ y: parallaxY * 0.2 }} // Subtle parallax
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full border border-primary/10"
          variants={decorationVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          style={{ y: parallaxY * 0.3 }} // More pronounced parallax
        />
      </div>

      {/* Main content container */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Welcome text with staggered animation */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6"
            variants={textVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            custom={0} // No delay for first element
          >
            Welcome to My Portfolio
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-base-content/70 mb-12"
            variants={textVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            custom={0.2} // Slight delay after title
          >
            I create beautiful and functional web experiences
          </motion.p>

          {/* Call to action buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={textVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            custom={0.4} // More delay for buttons
          >
            <button
              onClick={() => navigate('/projects')}
              className="btn btn-primary px-8"
            >
              View My Work
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="btn btn-outline btn-primary px-8"
            >
              Get in Touch
            </button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <div className="flex flex-col items-center text-base-content/50">
              <span className="text-sm mb-2">Scroll to explore</span>
              <motion.div
                className="w-1 h-8 rounded-full bg-primary/20"
                animate={{
                  scaleY: [1, 0.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gradient overlay that changes with scroll */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            180deg,
            transparent,
            var(--color-base-100) ${Math.min(100, progress * 200)}%
          )`
        }}
      />
    </section>
  );
}, propsAreEqual);

export default HeroSection;