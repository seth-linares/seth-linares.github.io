// src/hooks/useProjectsSection.ts

import { useCallback, useState } from 'react';
import { siteData } from '@/personal-site-data';
import { ProjectSection } from '@/types/portfolio';
import { getProjectCategoryIcon } from '@/utils/iconMaps';

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
        return getProjectCategoryIcon(category);
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