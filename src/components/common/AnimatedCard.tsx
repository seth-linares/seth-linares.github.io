// src/components/common/AnimatedCard.tsx

import React from 'react';
import { motion } from 'motion/react';
import { ANIMATION_VARIANTS, CARD_VIEWPORT_CONFIG } from '@/utils/animations';
import { AnimatedCardProps } from '@/types/components';

function AnimatedCard({
    children,
    index = 0,
    delay,
    className = '',
    onClick,
    variant = 'default',
}: AnimatedCardProps) {
    const calculatedDelay = delay ?? index * 0.1;

    const baseClasses = 'card shadow-lg hover:shadow-xl transition-shadow duration-300';
    const variantClasses = variant === 'clickable' ? 'cursor-pointer' : '';
    const combinedClasses = `${baseClasses} ${variantClasses} ${className}`;

    return (
        <motion.div
            initial={ANIMATION_VARIANTS.cardEntry.initial}
            whileInView={{
                ...ANIMATION_VARIANTS.cardEntry.animate,
                transition: {
                    ...ANIMATION_VARIANTS.cardEntry.animate.transition,
                    delay: calculatedDelay,
                },
            }}
            whileHover={variant === 'clickable' ? ANIMATION_VARIANTS.buttonHover : undefined}
            viewport={CARD_VIEWPORT_CONFIG}
            className={combinedClasses}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}

export default React.memo(AnimatedCard);
