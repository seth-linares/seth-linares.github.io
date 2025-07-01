import { useCallback, useState } from 'react';
import { siteData } from '@/personal-site-data';
import { ProjectSection } from '@/types';

function useProjectsSection() {
    const projectsData = siteData.projects;
    const [selectedProject, setSelectedProject] = useState<ProjectSection | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleProjectLink = useCallback((url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const handleOpenModal = useCallback((project: ProjectSection) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedProject(null);
    }, []);

    const getCategoryIcon = useCallback((category: string): string => {
        const categoryIcons: Record<string, string> = {
            security: '🔒',
            education: '📚',
            tools: '🛠️',
            ai: '🤖',
            web: '🌐',
            mobile: '📱',
            desktop: '💻'
        };
        return categoryIcons[category] || '⭐';
    }, []);

    return {
        projectsData,
        selectedProject,
        isModalOpen,
        handleProjectLink,
        handleOpenModal,
        handleCloseModal,
        getCategoryIcon
    };
}

export default useProjectsSection;