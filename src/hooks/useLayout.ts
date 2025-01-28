// src/hooks/useLayout.ts

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationItem, UseLayoutReturn } from '../types';
import { useDebounceRAF } from './useDebounce';

export function useLayout(): UseLayoutReturn {
  console.group('useLayout Hook');
  console.log('Hook initialized');

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

  // Handle scroll events with RAF debouncing
  const handleScroll = useDebounceRAF(() => {
    const scrolled = window.scrollY > 50;
    setIsScrolled(scrolled);
    
    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(window.scrollY / windowHeight, 1);
    setScrollProgress(progress);
  });

  // Update current path when location changes
  useEffect(() => {
    console.group('Location Change Effect');
    console.log('Previous path:', currentPath);
    console.log('New path:', location.pathname);
    setCurrentPath(location.pathname);
    // Close mobile nav when route changes
    setIsNavOpen(false);
    console.groupEnd();
  }, [location, currentPath]); // Include currentPath since we use it in the effect

  // Set up scroll listener
  useEffect(() => {
    console.group('Scroll Listener Effect');
    console.log('Setting up scroll listener');
    window.addEventListener('scroll', handleScroll);
    return () => {
      console.log('Cleaning up scroll listener');
      console.groupEnd();
      window.removeEventListener('scroll', handleScroll);
    };
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

  console.groupEnd();
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