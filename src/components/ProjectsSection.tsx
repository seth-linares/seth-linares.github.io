// src/components/ProjectsSection.tsx

import { motion } from 'motion/react';
import useProjectsSection from '@/hooks/useProjectsSection';
import ProjectModal from './ProjectModal';

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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-base-content mb-4">Featured Projects</h2>
                    <div className="w-24 h-1 bg-primary mx-auto mb-4"></div>
                    <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                        A collection of projects showcasing my expertise in security, education, and developer tools
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {projectsData.filter(project => project.featured).map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="card bg-base-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            onClick={() => handleOpenModal(project)}
                        >
                            <div className="card-body p-8">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <span className="text-2xl">{getCategoryIcon(project.category)}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-base-content">
                                                {project.title}
                                            </h3>
                                            <p className="text-primary font-medium">
                                                {project.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="badge badge-primary text-xs">Featured</span>
                                </div>

                                <p className="text-base-content/80 leading-relaxed mb-4">
                                    {project.longDescription || project.description}
                                </p>

                                <div className="space-y-4 mb-6">
                                    <h4 className="font-semibold text-base-content">Key Highlights</h4>
                                    <div className="space-y-2">
                                        {project.highlights.slice(0, 3).map((highlight, highlightIndex) => (
                                            <div key={highlightIndex} className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-sm text-base-content/70">{highlight}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {project.technologies.slice(0, 6).map((tech, techIndex) => (
                                            <span
                                                key={techIndex}
                                                className="badge badge-outline text-xs"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                        {project.technologies.length > 6 && (
                                            <span className="badge badge-ghost text-xs">
                                                +{project.technologies.length - 6} more
                                            </span>
                                        )}
                                    </div>

                                    <div className="card-actions justify-end gap-2">
                                        {project.links.github && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleProjectLink(project.links.github!);
                                                }}
                                                className="btn btn-primary btn-sm"
                                            >
                                                View Code
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                >
                    <h3 className="text-2xl font-bold text-center mb-8">Other Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projectsData.filter(project => !project.featured).map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                                onClick={() => handleOpenModal(project)}
                            >
                                <div className="card-body p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-lg">{getCategoryIcon(project.category)}</span>
                                        <div>
                                            <h4 className="text-lg font-bold text-base-content">
                                                {project.title}
                                            </h4>
                                            <p className="text-sm text-primary font-medium">
                                                {project.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-base-content/80 text-sm mb-4">
                                        {project.description}
                                    </p>
                                    
                                    {/* Show top 2 highlights for other projects */}
                                    {project.highlights && project.highlights.length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            {project.highlights.slice(0, 2).map((highlight, highlightIndex) => (
                                                <div key={highlightIndex} className="flex items-start gap-2">
                                                    <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                                    <p className="text-xs text-base-content/60">{highlight}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {project.technologies.slice(0, 4).map((tech, techIndex) => (
                                            <span
                                                key={techIndex}
                                                className="badge badge-outline badge-xs"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="card-actions justify-end gap-2">
                                        {project.links.github && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleProjectLink(project.links.github!);
                                                }}
                                                className="btn btn-outline btn-xs"
                                            >
                                                GitHub
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
            
            {/* Project Modal */}
            <ProjectModal 
                project={selectedProject}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </section>
    );
}

export default ProjectsSection;