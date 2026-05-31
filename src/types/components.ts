// UI component types

export interface AnimatedLogoProps {
    isHovered: boolean;
    onHoverStart: () => void;
    onHoverEnd: () => void;
    className?: string;
}
