// src/hooks/useSkillsSection.ts

import { useCallback } from 'react';
import { siteData } from '@/personal-site-data';
import { getSkillCategoryIcon } from '@/utils/iconMaps';

function useSkillsSection() {
    const skillsData = siteData.skills;

    const getCategoryIcon = useCallback((categoryName: string): string => {
        return getSkillCategoryIcon(categoryName);
    }, []);

    return {
        skillsData,
        getCategoryIcon
    };
}

export default useSkillsSection;