// src/hooks/useHomePage.ts

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function useHomePage() {
    const location = useLocation();
    const [currentSection, setCurrentSection] = useState('main');

    const scrollToSection = (sectionId: string) => {
        setCurrentSection(sectionId);
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    // Handle scrolling when navigated from another page
    useEffect(() => {
        const state = location.state as { scrollTo?: string } | null;
        if (state?.scrollTo) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                scrollToSection(state.scrollTo!);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [location.state]);

    // Tools section data - currently just one tool
    const toolsData = {
        title: "Developer Tools",
        description: "Practical tools built to solve real development challenges",
        tools: [
            {
                id: 'prompt-builder',
                icon: '🤖',
                title: 'Prompt Builder',
                subtitle: 'AI Prompt Engineering Tool',
                description: 'Build prompts by combining files and text with optional token counting. Perfect for LLM prompt engineering and context management.',
                technologies: ['React', 'TypeScript', 'Anthropic API'],
                link: '/prompt-generator',
                linkText: 'Try It Now'
            }
        ]
    };

    return {
        location,
        currentSection,
        scrollToSection,
        toolsData
    };
}

export default useHomePage;


