// src/components/common/AnimatedButton.tsx

import React from 'react';
import { motion } from 'motion/react';
import { ANIMATION_VARIANTS } from '@/utils/animations';
import { AnimatedButtonProps } from '@/types/general_types';

function AnimatedButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}: AnimatedButtonProps) {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size !== 'md' ? `btn-${size}` : '';
  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();

  return (
    <motion.button
      className={combinedClasses}
      whileHover={ANIMATION_VARIANTS.buttonHover}
      whileTap={ANIMATION_VARIANTS.buttonTap}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default React.memo(AnimatedButton);