// src/components/ProjectModal.tsx

import { motion, AnimatePresence } from 'motion/react';
import useProjectModal from '@/hooks/useProjectModal';
import { ProjectModalProps } from '@/types/portfolio';
import { ANIMATION_VARIANTS } from '@/utils/animations';
import { FaGithub } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import { IoDocumentTextOutline, IoClose } from 'react-icons/io5';

function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
    const { handleBackdropClick, handleLinkClick, getCategoryIcon } = useProjectModal({
        project,
        isOpen,
        onClose,
    });

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

                    {/* Modal Container */}
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={handleBackdropClick}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-base-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
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
                                            <span className="text-3xl">
                                                {getCategoryIcon(project.category)}
                                            </span>
                                        </div>
                                        <div>
                                            <h2
                                                id="modal-title"
                                                className="text-3xl font-bold text-base-content mb-1"
                                            >
                                                {project.title}
                                            </h2>
                                            <p className="text-xl text-primary font-medium">
                                                {project.subtitle}
                                            </p>
                                            {project.featured && (
                                                <span className="badge badge-primary mt-2">
                                                    Featured Project
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="btn btn-sm btn-circle btn-ghost"
                                        aria-label="Close modal"
                                    >
                                        <IoClose className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 overflow-y-auto">
                                <div className="space-y-8">
                                    {/* Description */}
                                    <div>
                                        <h3 className="text-xl font-bold text-base-content mb-4">
                                            About This Project
                                        </h3>
                                        <p className="text-base-content/80 leading-relaxed text-lg">
                                            {project.longDescription || project.description}
                                        </p>
                                    </div>

                                    {/* Highlights */}
                                    {project.highlights && project.highlights.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-bold text-base-content mb-4">
                                                Key Achievements
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {project.highlights.map((highlight, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{
                                                            delay: index * 0.1,
                                                            duration: 0.4,
                                                        }}
                                                        className="flex items-start gap-3 p-4 bg-base-200 rounded-lg"
                                                    >
                                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>
                                                        <p className="text-base-content/80">
                                                            {highlight}
                                                        </p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Technologies */}
                                    <div>
                                        <h3 className="text-xl font-bold text-base-content mb-4">
                                            Technologies Used
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {project.technologies.map((tech, index) => (
                                                <motion.span
                                                    key={index}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={ANIMATION_VARIANTS.scaleIn.animate}
                                                    transition={{
                                                        delay: index * 0.05,
                                                        duration: 0.3,
                                                    }}
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
                                            <FaGithub className="w-5 h-5" />
                                            View Source Code
                                        </button>
                                    )}
                                    {project.links.demo && (
                                        <button
                                            onClick={() => handleLinkClick(project.links.demo!)}
                                            className="btn btn-secondary gap-2"
                                        >
                                            <FiExternalLink className="w-5 h-5" />
                                            Live Demo
                                        </button>
                                    )}
                                    {project.links.documentation && (
                                        <button
                                            onClick={() =>
                                                handleLinkClick(project.links.documentation!)
                                            }
                                            className="btn btn-outline gap-2"
                                        >
                                            <IoDocumentTextOutline className="w-5 h-5" />
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
