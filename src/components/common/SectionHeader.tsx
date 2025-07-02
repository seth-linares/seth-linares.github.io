// src/components/common/SectionHeader.tsx

import React from 'react';
import { motion } from 'motion/react';
import { ANIMATION_VARIANTS, VIEWPORT_CONFIG } from '@/utils/animations';
import { SectionHeaderProps } from '@/types/general_types';


function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <motion.div
      {...ANIMATION_VARIANTS.fadeUp}
      whileInView={ANIMATION_VARIANTS.fadeUp.animate}
      viewport={VIEWPORT_CONFIG}
      className="text-center mb-16"
    >
      <h2 className="text-4xl font-bold text-base-content mb-4">{title}</h2>
      <div className="w-24 h-1 bg-primary mx-auto mb-4"></div>
      {description && (
        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </motion.div>
  );
}

export default React.memo(SectionHeader);