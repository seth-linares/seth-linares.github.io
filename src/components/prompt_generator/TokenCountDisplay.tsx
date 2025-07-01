// src/components/prompt_generator/TokenCountDisplay.tsx

import { motion, AnimatePresence } from 'motion/react';

interface TokenCountDisplayProps {
  tokenCount: number | null;
}

const TokenCountDisplay: React.FC<TokenCountDisplayProps> = ({ tokenCount }) => (
  <AnimatePresence>
    {tokenCount !== null && (
      <motion.div
        className="card bg-success text-primary-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="card-body py-8">
          <div className="flex flex-col items-center justify-center gap-2 text-success-content">
            <span className="text-2xl font-medium">Total Tokens</span>
            <motion.span
              className="text-6xl font-bold"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {tokenCount?.toLocaleString()}
            </motion.span>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default TokenCountDisplay;
