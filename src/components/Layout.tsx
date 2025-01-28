// src/components/Layout.tsx

import { Outlet } from 'react-router-dom';
import { useLayout } from '@/hooks/useLayout';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

const Layout = () => {
  console.group('Layout Component');
  console.time('Layout render');

  const {
    isNavOpen,
    currentPath,
    navigationItems,
    isScrolled,
    scrollProgress,
    toggleNav,
    closeNav,
    navigateToPage
  } = useLayout();

  useEffect(() => {
    console.group('Layout Effects');
    console.log('Path changed:', currentPath);
    console.log('Nav state:', isNavOpen);
    console.log('Scroll progress:', scrollProgress);
    console.groupEnd();
  }, [currentPath, isNavOpen, scrollProgress]);

  // Framer Motion variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  console.timeEnd('Layout render');
  console.groupEnd();

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation Bar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? 'bg-base-100/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Home Link */}
            <button 
              onClick={() => navigateToPage('/')}
              className="text-xl font-bold text-primary"
            >
              Your Logo
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {navigationItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigateToPage(item.path)}
                  className={`transition-colors duration-200 ${
                    currentPath === item.path 
                      ? 'text-primary font-medium' 
                      : 'text-base-content/70 hover:text-primary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={toggleNav}
              className="md:hidden p-2 rounded-lg hover:bg-base-200"
              aria-label="Toggle navigation menu"
            >
              <div className={`w-6 h-0.5 bg-current transition-all ${
                isNavOpen ? 'rotate-45 translate-y-0.5' : ''
              }`} />
              <div className={`w-6 h-0.5 bg-current transition-all mt-1.5 ${
                isNavOpen ? 'opacity-0' : ''
              }`} />
              <div className={`w-6 h-0.5 bg-current transition-all mt-1.5 ${
                isNavOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          className={`md:hidden transition-all duration-300 ${
            isNavOpen 
              ? 'max-h-64 opacity-100' 
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="container mx-auto px-4 py-2 bg-base-100/80 backdrop-blur-lg">
            {navigationItems.map(item => (
              <button
                key={item.path}
                onClick={() => {
                  navigateToPage(item.path);
                  closeNav();
                }}
                className={`block w-full text-left py-2 px-4 rounded-lg transition-colors duration-200 ${
                  currentPath === item.path 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-base-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Page Content with Transitions */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Scroll Progress Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary/20 z-50"
      >
        <div 
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Layout;