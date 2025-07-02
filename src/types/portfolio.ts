// Portfolio and site data types

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

// Project component props
export interface CompactProjectCardProps {
  project: ProjectSection;
  index: number;
  onOpenModal: (project: ProjectSection) => void;
  onProjectLink: (url: string) => void;
  getCategoryIcon: (category: string) => string;
}

export interface FeaturedProjectCardProps {
  project: ProjectSection;
  index: number;
  onOpenModal: (project: ProjectSection) => void;
  onProjectLink: (url: string) => void;
  getCategoryIcon: (category: string) => string;
}

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