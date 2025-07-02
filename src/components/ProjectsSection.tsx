// src/components/ProjectsSection.tsx

import { lazy, Suspense } from 'react';
import useProjectsSection from '@/hooks/useProjectsSection';
import SectionHeader from '@/components/common/SectionHeader';
import FeaturedProjectCard from '@/components/projects/FeaturedProjectCard';
import CompactProjectCard from '@/components/projects/CompactProjectCard';

// Lazy load ProjectModal since it's only used when opened
const ProjectModal = lazy(() => import('./ProjectModal'));

function ProjectsSection() {
    const { 
        projectsData, 
        selectedProject, 
        isModalOpen, 
        handleProjectLink, 
        handleOpenModal, 
        handleCloseModal, 
        getCategoryIcon 
    } = useProjectsSection();

    return (
        <section id="projects" className="py-20 bg-base-100">
            <div className="container mx-auto px-4 max-w-7xl">
                <SectionHeader 
                    title="Featured Projects" 
                    description="A collection of projects showcasing my expertise in security, education, and developer tools" 
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {projectsData.filter(project => project.featured).map((project, index) => (
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

                <SectionHeader 
                    title="Other Projects" 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projectsData.filter(project => !project.featured).map((project, index) => (
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
            
            {/* Lazy-loaded Project Modal */}
            {isModalOpen && (
                <Suspense fallback={<div className="modal modal-open"><div className="modal-box">Loading...</div></div>}>
                    <ProjectModal 
                        project={selectedProject}
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                    />
                </Suspense>
            )}
        </section>
    );
}

export default ProjectsSection;