// src/components/projects/FeaturedProjectCard.tsx

import React from 'react';
import { FeaturedProjectCardProps } from '@/types/portfolio';
import AnimatedCard from '@/components/common/AnimatedCard';

function FeaturedProjectCard({
    project,
    index,
    onOpenModal,
    onProjectLink,
    getCategoryIcon,
}: FeaturedProjectCardProps) {
    return (
        <AnimatedCard
            index={index}
            className="bg-base-200"
            onClick={() => onOpenModal(project)}
            variant="clickable"
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
                            <p className="text-primary font-medium">{project.subtitle}</p>
                        </div>
                    </div>
                    <span className="badge badge-primary text-xs">Featured</span>
                </div>

                <p className="text-base-content/80 leading-relaxed mb-6">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {project.technologies.slice(0, 6).map((tech, techIndex) => (
                        <span key={techIndex} className="badge badge-outline text-xs">
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
                                onProjectLink(project.links.github!);
                            }}
                            className="btn btn-primary btn-sm btn-animated"
                        >
                            View Code
                        </button>
                    )}
                </div>
            </div>
        </AnimatedCard>
    );
}

export default React.memo(FeaturedProjectCard);
