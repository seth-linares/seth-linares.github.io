// src/pages/Home/sections/NavigationSection.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface NavigationSectionProps {
  isVisible: boolean;
  progress: number;
}

// We define our navigation cards with their content and destination routes
const navigationCards = [
  {
    title: 'Projects',
    description: 'Explore my portfolio of work and personal projects',
    path: '/projects',
    iconClass: 'i-lucide-folder', // Using Lucide icons
    color: 'var(--color-primary)',
    delay: 0
  },
  {
    title: 'About Me',
    description: 'Learn more about my journey and experience',
    path: '/about',
    iconClass: 'i-lucide-user',
    color: 'var(--color-secondary)',
    delay: 0.1
  },
  {
    title: 'Contact',
    description: 'Get in touch with me for opportunities or collaboration',
    path: '/contact',
    iconClass: 'i-lucide-mail',
    color: 'var(--color-accent)',
    delay: 0.2
  }
];

const NavigationSection: React.FC<NavigationSectionProps> = ({ isVisible, progress }) => {
  const navigate = useNavigate();

  // Animation variants for the section title
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Animation variants for the navigation cards
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: (delay: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.6,
        ease: "easeOut"
      }
    }),
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  // Calculate scroll-based parallax effect
  const parallaxY = (progress - 0.5) * 100; // Center the parallax effect around the middle of the section

  return (
    <section className="min-h-screen py-20 relative overflow-hidden">
      {/* Background decoration */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, var(--color-primary) 0%, transparent 70%)`,
          y: parallaxY
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section title */}
        <motion.div
          className="text-center mb-16"
          variants={titleVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Explore My Work
          </h2>
          <p className="text-xl text-base-content/70">
            Navigate through different aspects of my portfolio
          </p>
        </motion.div>

        {/* Navigation cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {navigationCards.map((card) => (
            <motion.button
              key={card.path}
              onClick={() => navigate(card.path)}
              className="group relative bg-base-200 rounded-xl p-6 text-left hover:shadow-lg transition-shadow"
              variants={cardVariants}
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              whileHover="hover"
              custom={card.delay}
            >
              {/* Card background gradient */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${card.color}, transparent)`
                }}
              />

              {/* Card content */}
              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`${card.iconClass} w-12 h-12 mb-4 text-primary`}
                  style={{ color: card.color }}
                />

                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                
                <p className="text-base-content/70">
                  {card.description}
                </p>

                {/* Animated arrow indicator */}
                <motion.div
                  className="mt-4 flex items-center text-primary"
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                >
                  Learn more
                  <div className="i-lucide-arrow-right ml-2" />
                </motion.div>
              </div>

              {/* Interactive hover effect */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-primary/0 group-hover:border-primary/20 transition-colors"
                initial={false}
                whileHover={{
                  boxShadow: `0 0 20px ${card.color}10`
                }}
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Gradient fade effect at the bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent, var(--color-base-100))`
        }}
      />
    </section>
  );
};

export default NavigationSection;