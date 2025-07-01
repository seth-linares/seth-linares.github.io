// src/hooks/useContactSection.ts

import { useCallback } from 'react';
import { siteData } from '@/personal-site-data';

function useContactSection() {
    const contactData = siteData.contact;

    const handleContactClick = useCallback((type: string, value: string) => {
        switch (type) {
            case 'email':
                window.location.href = `mailto:${value}`;
                break;
            case 'phone':
                window.location.href = `tel:${value}`;
                break;
            case 'linkedin':
            case 'github':
                window.open(value, '_blank', 'noopener,noreferrer');
                break;
            default:
                break;
        }
    }, []);

    const getContactIcon = useCallback((type: string): string => {
        const iconMap: Record<string, string> = {
            email: '📧',
            phone: '📱',
            linkedin: '💼',
            github: '🐱',
            website: '🌐',
            twitter: '🐦'
        };
        return iconMap[type] || '📞';
    }, []);

    return {
        contactData,
        handleContactClick,
        getContactIcon
    };
}

export default useContactSection;