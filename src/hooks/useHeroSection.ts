// src/hooks/useHeroSection.ts

import { useCallback } from 'react';
import { siteData } from '@/personal-site-data';

function useHeroSection() {
    const heroData = siteData.hero;

    const handleCtaClick = useCallback((link: string) => {
        if (link.startsWith('#')) {
            const element = document.querySelector(link);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        } else {
            window.open(link, '_blank', 'noopener,noreferrer');
        }
    }, []);

    const handleResumeDownload = useCallback(() => {
        const link = document.createElement('a');
        link.href = '/Seth_Linares_Resume.pdf';
        link.download = 'Seth_Linares_Resume.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    return {
        heroData,
        handleCtaClick,
        handleResumeDownload,
    };
}

export default useHeroSection;
