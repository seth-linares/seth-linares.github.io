// UI component types

import { ReactNode } from 'react';

// Common component types
export interface AnimatedCardProps {
    children: ReactNode;
    index?: number;
    delay?: number;
    className?: string;
    onClick?: () => void;
    variant?: 'default' | 'clickable';
}

export interface AnimatedLogoProps {
    isHovered: boolean;
    onHoverStart: () => void;
    onHoverEnd: () => void;
    className?: string;
}

export interface SectionHeaderProps {
    title: string;
    description?: string;
}
