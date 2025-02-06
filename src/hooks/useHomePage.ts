// src/hooks/useHomePage.ts
import { useState } from 'react';

function useHomePage() {
    const [currentSection, setCurrentSection] = useState('main');

    const scrollToSection = (sectionId: string) => {
        setCurrentSection(sectionId);
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    // Animation states
    const pageAnimationProps = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
    };

    return {
        currentSection,
        scrollToSection,
        pageAnimationProps
    };
}

export default useHomePage;


