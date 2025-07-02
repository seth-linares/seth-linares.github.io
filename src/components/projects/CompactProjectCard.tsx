// src/components/projects/CompactProjectCard.tsx

import React from 'react';
import { motion } from 'motion/react';
import { ProjectSection } from '@/types/general_types';
import { ANIMATION_VARIANTS, CARD_VIEWPORT_CONFIG } from '@/utils/animations';
import AnimatedButton from '@/components/common/AnimatedButton';

interface CompactProjectCardProps {
  project: ProjectSection;
  index: number;
  onOpenModal: (project: ProjectSection) => void;
  onProjectLink: (url: string) => void;
  getCategoryIcon: (category: string) => string;
}

function CompactProjectCard({ 
  project, 
  index, 
  onOpenModal, 
  onProjectLink, 
  getCategoryIcon 
}: CompactProjectCardProps) {
  return (
    <motion.div
      key={project.id}
      initial={ANIMATION_VARIANTS.fadeUpSubtle.initial}
      whileInView={{
        ...ANIMATION_VARIANTS.fadeUpSubtle.animate,
        transition: {
          ...ANIMATION_VARIANTS.fadeUpSubtle.transition,
          delay: index * 0.1
        }
      }}
      viewport={CARD_VIEWPORT_CONFIG}
      className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onOpenModal(project)}
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
            <AnimatedButton
              onClick={(e) => {
                e.stopPropagation();
                onProjectLink(project.links.github!);
              }}
              variant="outline"
              size="sm"
            >
              View
            </AnimatedButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default React.memo(CompactProjectCard);