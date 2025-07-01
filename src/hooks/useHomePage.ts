// src/hooks/useHomePage.ts
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function useHomePage() {
    const location = useLocation()
    const [currentSection, setCurrentSection] = useState('main');

    const scrollToSection = (sectionId: string) => {
        setCurrentSection(sectionId);
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    // Handle scrolling when navigated from another page
    useEffect(() => {
        const state = location.state as { scrollTo?: string } | null
        if (state?.scrollTo) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                scrollToSection(state.scrollTo!)
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [location.state])

    return {
        currentSection,
        scrollToSection
    };
}

export default useHomePage;


