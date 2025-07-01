// src/hooks/useSkillsSection.ts

import { useCallback } from 'react';
import { siteData } from '@/personal-site-data';

function useSkillsSection() {
    const skillsData = siteData.skills;

    const getCategoryIcon = useCallback((categoryName: string): string => {
        const categoryIcons: Record<string, string> = {
            'Languages': '💻',
            'Web Technologies': '🌐',
            'Tools & Infrastructure': '🔧',
            'Specializations': '⚡',
            'Frameworks': '🏗️',
            'Databases': '📊',
            'Cloud & DevOps': '☁️'
        };
        return categoryIcons[categoryName] || '🔧';
    }, []);

    return {
        skillsData,
        getCategoryIcon
    };
}

export default useSkillsSection;