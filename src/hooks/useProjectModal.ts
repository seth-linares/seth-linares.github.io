// src/hooks/useProjectModal.ts

import { useCallback, useEffect } from 'react';
import { ProjectSection, UseProjectModalProps } from '@/types/general_types';
import { getProjectCategoryIcon } from '@/utils/iconMaps';


function useProjectModal({ isOpen, onClose }: UseProjectModalProps) {
    const handleBackdropClick = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleLinkClick = useCallback((url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const getCategoryIcon = useCallback((category: ProjectSection['category']) => {
        return getProjectCategoryIcon(category);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Focus management
    useEffect(() => {
        if (isOpen) {
            // Focus the modal when it opens
            const modal = document.querySelector('[role="dialog"]');
            if (modal instanceof HTMLElement) {
                modal.focus();
            }
        }
    }, [isOpen]);

    return {
        handleBackdropClick,
        handleLinkClick,
        getCategoryIcon
    };
}

export default useProjectModal;