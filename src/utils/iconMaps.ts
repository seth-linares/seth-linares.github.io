// src/utils/iconMaps.ts


// Icon maps for different domains
export const VALUE_ICONS: Record<string, string> = {
  shield: '/icons/security-safe-shield.svg',
  cpu: '/icons/lightning.svg',
  heart: '/icons/heart-love.svg',
  code: '💻',
  security: '🔒',
  performance: '⚡',
  design: '🎨'
};

export const PROJECT_CATEGORY_ICONS: Record<string, string> = {
  security: '🔒',
  education: '📚',
  tools: '🛠️',
  ai: '🤖',
  web: '🌐',
  mobile: '📱',
  desktop: '💻'
};

export const SKILL_CATEGORY_ICONS: Record<string, string> = {
  'Languages': '💻',
  'Web Technologies': '🌐',
  'Tools & Infrastructure': '🔧',
  'Specializations': '⚡',
  'Frameworks': '🏗️',
  'Databases': '📊',
  'Cloud & DevOps': '☁️'
};

// Utility functions for icon retrieval
export const getValueIcon = (iconName: string): string => {
  return VALUE_ICONS[iconName] || '⭐';
};

export const getProjectCategoryIcon = (category: string): string => {
  return PROJECT_CATEGORY_ICONS[category] || '⭐';
};

export const getSkillCategoryIcon = (categoryName: string): string => {
  return SKILL_CATEGORY_ICONS[categoryName] || '🔧';
};

// Generic icon getter with fallback
export const getIcon = (iconMap: Record<string, string>, key: string, fallback = '⭐'): string => {
  return iconMap[key] || fallback;
};