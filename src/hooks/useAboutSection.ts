// src/hooks/useAboutSection.ts

import { siteData } from '@/personal-site-data';
import { getValueIcon } from '@/utils/iconMaps';

function useAboutSection() {
    const aboutData = siteData.about;

    return {
        aboutData,
        getValueIcon,
    };
}

export default useAboutSection;
