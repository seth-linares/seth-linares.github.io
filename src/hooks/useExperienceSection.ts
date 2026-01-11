// src/hooks/useExperienceSection.ts

import { siteData } from '@/personal-site-data';

function useExperienceSection() {
    const experienceData = siteData.experience;

    return {
        experienceData,
    };
}

export default useExperienceSection;
