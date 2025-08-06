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
                icon: '/icons/prompt-builder.svg',
                title: 'Prompt Builder',
                subtitle: 'AI Prompt Engineering Tool',
                description: 'Build prompts by combining files and text with optional token counting. Perfect for LLM prompt engineering and context management.',
                technologies: ['React', 'TypeScript', 'Anthropic API'],
                link: '/prompt-generator',
                linkText: 'Try It Now'
            },
            {
                id: 'regex-playground',
                icon: '/icons/regex-playground.svg',
                title: 'Regex Playground',
                subtitle: 'Interactive Regex Testing Tool',
                description: 'Test, learn, and debug regular expressions with real-time matching, multiple test strings, and a handy pattern library.',
                technologies: ['React', 'TypeScript', 'Tailwind', 'DaisyUI'],
                link: '/regex-playground',
                linkText: 'Open Playground'
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
