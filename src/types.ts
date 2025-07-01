// src/types.ts

import { RefObject } from "react";


/************
  Home Types
*************/

// Define our section types
export type Section = 'hero' | 'navigation' | 'content';

// Interface for animation states
export interface AnimationState {
  isVisible: boolean;
  hasAnimated: boolean;
  progress: number;
}

// Interface for our hook's return value
export interface UseHomeReturn {
  // Current section information
  currentSection: Section;
  sectionRefs: {
    [K in Section]: RefObject<HTMLDivElement | null>; // Changed from HTMLElement to HTMLDivElement
  };
  
  // Animation states for each section
  animationStates: {
    [K in Section]: AnimationState;
  };
  
  // Scroll progress
  scrollProgress: number;
  
  // Methods
  scrollToSection: (section: Section) => void;
}




/************
  Layout Types
*************/

export interface NavigationItem {
    path: string;
    label: string;
    icon?: string;
}

export interface UseLayoutReturn {
    // Navigation state
    isNavOpen: boolean;
    currentPath: string;
    navigationItems: NavigationItem[];

    // Scroll state
    isScrolled: boolean;
    scrollProgress: number;

    // Animation states
    isPageTransitioning: boolean;

    // Methods
    toggleNav: () => void;
    closeNav: () => void;
    navigateToPage: (path: string) => void;
}

/*
    Interfaces for personal info
*/

export interface PersonalSiteData {
  hero: HeroSection;
  about: AboutSection;
  experience: ExperienceSection[];
  projects: ProjectSection[];
  skills: SkillsSection;
  education: EducationSection[];
  contact: ContactSection;
}

export interface HeroSection {
  name: string;
  title: string;
  tagline: string;
  cta: {
    primary: { text: string; link: string };
    secondary: { text: string; link: string };
  };
}

export interface AboutSection {
  summary: string;
  highlights: string[];
  values: { icon: string; title: string; description: string }[];
}

export interface ExperienceSection {
  company: string;
  position: string;
  location: string;
  duration: string;
  current: boolean;
  achievements: string[];
  technologies: string[];
}

export interface ProjectSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription?: string;
  technologies: string[];
  links: {
    github?: string;
    demo?: string;
    documentation?: string;
  };
  highlights: string[];
  featured: boolean;
  category: 'security' | 'tools' | 'ai' | 'education';
}

export interface SkillsSection {
  categories: {
    name: string;
    skills: string[];
  }[];
}

export interface EducationSection {
  institution: string;
  degree: string;
  location: string;
  duration: string;
  gpa: string;
  highlights: string[];
}

export interface ContactSection {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
}
