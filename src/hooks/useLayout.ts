// src/hooks/useLayout.ts

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationItem, UseLayoutReturn } from '../types';



export function useLayout(): UseLayoutReturn {
  // Router hooks
  const location = useLocation();
  const navigate = useNavigate();
  
  // Navigation state
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(location.pathname);
  
  // Scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Animation state
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  
  // Define our navigation items
  const navigationItems: NavigationItem[] = [
    { path: '/', label: 'Home' },
    { path: '/projects', label: 'Projects' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' }
  ];

  // Handle scroll events with debouncing for performance
  const handleScroll = useCallback(() => {
    // Check if page is scrolled past threshold
    const scrolled = window.scrollY > 50;
    setIsScrolled(scrolled);
    
    // Calculate scroll progress (0 to 1)
    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(window.scrollY / windowHeight, 1);
    setScrollProgress(progress);
  }, []);

  // Update current path when location changes
  useEffect(() => {
    setCurrentPath(location.pathname);
    // Close mobile nav when route changes
    setIsNavOpen(false);
  }, [location]);

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

  // Navigation methods
  const toggleNav = useCallback(() => {
    setIsNavOpen(prev => !prev);
  }, []);

  const closeNav = useCallback(() => {
    setIsNavOpen(false);
  }, []);

  const navigateToPage = useCallback((path: string) => {
    setIsPageTransitioning(true);
    
    // Small delay to allow animation to play
    setTimeout(() => {
      navigate(path);
      setIsPageTransitioning(false);
    }, 300); // Match this with your transition duration
  }, [navigate]);

  return {
    // Navigation state
    isNavOpen,
    currentPath,
    navigationItems,
    
    // Scroll state
    isScrolled,
    scrollProgress,
    
    // Animation state
    isPageTransitioning,
    
    // Methods
    toggleNav,
    closeNav,
    navigateToPage,
  };
}