// src/types.ts

import { MotionValue } from "motion/react";
import { ButtonHTMLAttributes, ReactNode, RefObject } from "react";


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



// Project modal
export interface ProjectModalProps {
    project: ProjectSection | null;
    isOpen: boolean;
    onClose: () => void;
}

export interface UseProjectModalProps {
    project: ProjectSection | null;
    isOpen: boolean;
    onClose: () => void;
}


// API Key
export interface ApiKeyFormProps {
  apiKeyInput: string;
  setApiKeyInput: (val: string) => void;
  localSaveApiKey: (e: React.FormEvent) => void;
}


// Generated prompt
export interface GeneratedPromptDisplayProps {
  generatedPrompt: string;
  showGeneratedPrompt: boolean;
  isPromptMinimized: boolean;
  setShowGeneratedPrompt: (val: boolean) => void;
  setIsPromptMinimized: (val: boolean) => void;
}

export interface FileCheckpoint {
  fileName: string;
  position: number;
}

export interface UseGeneratedPromptDisplayProps {
  generatedPrompt: string;
  showGeneratedPrompt: boolean;
  isPromptMinimized: boolean;
}


// Navbar
export interface NavbarState {
    // Mobile menu state
    isMobileMenuOpen: boolean
    toggleMobileMenu: () => void
    closeMobileMenu: () => void
    // Scroll animation state
    navbarHeight: MotionValue<number>
    navbarOpacity: MotionValue<number>
    navbarVisibility: MotionValue<number>
    showNavbar: () => void
    // Route-aware navigation
    isHomePage: boolean
    navigateToSection: (sectionId: string) => void
}

// FileContext 

/*
  We type the setter functions as React.Dispatch<React.SetStateAction<T>>
  to allow both direct state assignment and functional updates. In other words,
  the setter can receive either a new state value directly or a function that takes
  the current state and returns the updated value. This flexibility is essential
  for operations like appending new items to an array which we do since we have the
  ability to add more files to the existing list.
*/
export interface FileContextType {
  fileText: string;
  setFileText: React.Dispatch<React.SetStateAction<string>>;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  removeFile: (index: number) => void;
  fileContents: Map<string, string>;
  setFileContents: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  generatePrompt: (userPrompt: string) => string;
}


// Animated Button
// Exclude event handlers that conflict with Motion's animation and interaction system
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 
  | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onAnimationCancel'
  | 'onDragStart' | 'onDrag' | 'onDragEnd' | 'onDragEnter' | 'onDragExit' 
  | 'onDragLeave' | 'onDragOver' | 'onDrop'
>;

export interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}


// Animated Card
export interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  delay?: number;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'clickable';
}


// Section Header
export interface SectionHeaderProps {
  title: string;
  description?: string;
}