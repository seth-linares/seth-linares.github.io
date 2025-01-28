// src/pages/Home/sections/ContentSection.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ContentSectionProps {
  isVisible: boolean;
  progress: number;
}

// Example content items - in a real application, these would likely come from a CMS or API
const contentItems = [
  {
    title: 'Project Alpha',
    description: 'A modern web application built with React and TypeScript',
    category: 'Web Development',
    image: '/api/placeholder/600/400', // Using placeholder for demo
    path: '/projects/alpha',
    delay: 0
  },
  {
    title: 'Design System',
    description: 'Creating consistent and beautiful user interfaces',
    category: 'UI/UX Design',
    image: '/api/placeholder/600/400',
    path: '/projects/design-system',
    delay: 0.1
  },
  {
    title: 'API Integration',
    description: 'Seamless integration with third-party services',
    category: 'Backend Development',
    image: '/api/placeholder/600/400',
    path: '/projects/api-integration',
    delay: 0.2
  }
];

const ContentSection: React.FC<ContentSectionProps> = ({ isVisible, progress }) => {
  const navigate = useNavigate();

  // Animation variants for the section container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  // Animation variants for individual content items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.6,
        ease: "easeOut"
      }
    }),
    hover: {
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  // Calculate parallax effect based on scroll progress
  const parallaxY = (progress - 0.5) * 50;

  return (
    <section className="min-h-screen py-20 relative overflow-hidden">
      {/* Dynamic background pattern */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, var(--color-primary) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, var(--color-secondary) 0%, transparent 50%)
          `,
          y: parallaxY
        }}
      />

      <motion.div 
        className="container mx-auto px-4 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Latest Work
          </h2>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            Discover my recent projects and explore how I approach different challenges
          </p>
        </div>

        {/* Content grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {contentItems.map((item) => (
            <motion.article
              key={item.path}
              className="group relative bg-base-200 rounded-xl overflow-hidden"
              variants={itemVariants}
              custom={item.delay}
              whileHover="hover"
            >
              {/* Project image */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base-200 to-transparent opacity-50" />
              </div>

              {/* Content overlay */}
              <div className="relative p-6">
                {/* Category tag */}
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  {item.category}
                </span>

                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-base-content/70 mb-4">
                  {item.description}
                </p>

                {/* Action button */}
                <button
                  onClick={() => navigate(item.path)}
                  className="inline-flex items-center text-primary hover:underline"
                >
                  View Project
                  <motion.span
                    className="ml-2"
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                  >
                    →
                  </motion.span>
                </button>
              </div>

              {/* Interactive border effect */}
              <motion.div
                className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/20 rounded-xl transition-colors"
                initial={false}
                whileHover={{
                  boxShadow: '0 0 20px var(--color-primary-10)'
                }}
              />
            </motion.article>
          ))}
        </div>

        {/* View all projects button */}
        <motion.div 
          className="text-center mt-16"
          variants={itemVariants}
          custom={0.3}
        >
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-primary btn-lg"
          >
            View All Projects
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--color-base-100))'
        }}
      />
    </section>
  );
};

export default ContentSection;