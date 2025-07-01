import { motion, AnimatePresence } from 'motion/react';
import useProjectModal from '@/hooks/useProjectModal';
import { ProjectSection } from '@/types';

interface ProjectModalProps {
    project: ProjectSection | null;
    isOpen: boolean;
    onClose: () => void;
}

function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
    const { 
        handleBackdropClick, 
        handleLinkClick, 
        getCategoryIcon 
    } = useProjectModal({ project, isOpen, onClose });

    if (!project) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={handleBackdropClick}
                    />
                    
                    {/* Modal Container - Now with click handler */}
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={handleBackdropClick}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-base-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-title"
                            tabIndex={-1}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-base-200 p-6 border-b border-base-300">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <span className="text-3xl">{getCategoryIcon(project.category)}</span>
                                        </div>
                                        <div>
                                            <h2 id="modal-title" className="text-3xl font-bold text-base-content mb-1">
                                                {project.title}
                                            </h2>
                                            <p className="text-xl text-primary font-medium">
                                                {project.subtitle}
                                            </p>
                                            {project.featured && (
                                                <span className="badge badge-primary mt-2">Featured Project</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="btn btn-sm btn-circle btn-ghost"
                                        aria-label="Close modal"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                                <div className="space-y-8">
                                    {/* Description */}
                                    <div>
                                        <h3 className="text-xl font-bold text-base-content mb-4">About This Project</h3>
                                        <p className="text-base-content/80 leading-relaxed text-lg">
                                            {project.longDescription || project.description}
                                        </p>
                                    </div>
                                    
                                    {/* Highlights */}
                                    {project.highlights && project.highlights.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-bold text-base-content mb-4">Key Achievements</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {project.highlights.map((highlight, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1, duration: 0.4 }}
                                                        className="flex items-start gap-3 p-4 bg-base-200 rounded-lg"
                                                    >
                                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                                        <p className="text-base-content/80">{highlight}</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Technologies */}
                                    <div>
                                        <h3 className="text-xl font-bold text-base-content mb-4">Technologies Used</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {project.technologies.map((tech, index) => (
                                                <motion.span
                                                    key={index}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                                    className="badge badge-outline badge-lg"
                                                >
                                                    {tech}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="bg-base-200 p-6 border-t border-base-300">
                                <div className="flex flex-wrap gap-4 justify-center">
                                    {project.links.github && (
                                        <button
                                            onClick={() => handleLinkClick(project.links.github!)}
                                            className="btn btn-primary gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                            View Source Code
                                        </button>
                                    )}
                                    {project.links.demo && (
                                        <button
                                            onClick={() => handleLinkClick(project.links.demo!)}
                                            className="btn btn-secondary gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Live Demo
                                        </button>
                                    )}
                                    {project.links.documentation && (
                                        <button
                                            onClick={() => handleLinkClick(project.links.documentation!)}
                                            className="btn btn-outline gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Documentation
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

export default ProjectModal;