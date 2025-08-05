// src/components/common/CopyButton.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ANIMATION_VARIANTS } from '@/utils/animations';

interface CopyButtonProps {
  text: string;
  className?: string;
  children?: React.ReactNode;
  onCopy?: () => void;
}

export function CopyButton({ 
  text, 
  className = "btn btn-sm", 
  children, 
  onCopy 
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };
  
  return (
    <motion.button
      className={className}
      onClick={handleCopy}
      whileHover={ANIMATION_VARIANTS.buttonHover}
      whileTap={ANIMATION_VARIANTS.buttonTap}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-1"
          >
            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {children || 'Copy'}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default CopyButton;