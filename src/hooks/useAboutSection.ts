import { siteData } from '@/personal-site-data';

function useAboutSection() {
    const aboutData = siteData.about;

    const getValueIcon = (iconName: string): string => {
        const iconMap: Record<string, string> = {
            shield: '🛡️',
            cpu: '⚡',
            heart: '❤️',
            code: '💻',
            security: '🔒',
            performance: '⚡',
            design: '🎨'
        };
        return iconMap[iconName] || '⭐';
    };

    return {
        aboutData,
        getValueIcon
    };
}

export default useAboutSection;