// src/components/ProjectsSection.tsx

import { useMemo } from 'react';
import useProjectsSection from '@/hooks/useProjectsSection';
import SectionHeader from '@/components/common/SectionHeader';
import FeaturedProjectCard from '@/components/projects/FeaturedProjectCard';
import CompactProjectCard from '@/components/projects/CompactProjectCard';
import ProjectModal from './ProjectModal';

function ProjectsSection() {
    const {
        projectsData,
        selectedProject,
        isModalOpen,
        handleProjectLink,
        handleOpenModal,
        handleCloseModal,
        getCategoryIcon,
    } = useProjectsSection();

    const featuredProjects = useMemo(
        () => projectsData.filter((project) => project.featured),
        [projectsData]
    );
    const otherProjects = useMemo(
        () => projectsData.filter((project) => !project.featured),
        [projectsData]
    );

    return (
        <section id="projects" className="py-20 bg-base-100">
            <div className="container mx-auto px-4 max-w-7xl">
                <SectionHeader
                    title="Featured Projects"
                    description="A collection of projects showcasing my expertise in security, education, and developer tools"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {featuredProjects.map((project, index) => (
                        <FeaturedProjectCard
                            key={project.id}
                            project={project}
                            index={index}
                            onOpenModal={handleOpenModal}
                            onProjectLink={handleProjectLink}
                            getCategoryIcon={getCategoryIcon}
                        />
                    ))}
                </div>

                <SectionHeader title="Other Projects" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {otherProjects.map((project, index) => (
                        <CompactProjectCard
                            key={project.id}
                            project={project}
                            index={index}
                            onOpenModal={handleOpenModal}
                            onProjectLink={handleProjectLink}
                            getCategoryIcon={getCategoryIcon}
                        />
                    ))}
                </div>
            </div>

            <ProjectModal
                project={selectedProject}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </section>
    );
}

export default ProjectsSection;
