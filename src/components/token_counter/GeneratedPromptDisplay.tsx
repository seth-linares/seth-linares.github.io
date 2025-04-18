// src/components/token_counter/GeneratedPromptDisplay.tsx

import { motion, AnimatePresence } from 'motion/react';
import { Suspense, lazy } from 'react';
import { FiMaximize2, FiMinimize2, FiX } from 'react-icons/fi';

const MarkdownRenderer = lazy(() =>
  import('@/components/token_counter/MarkdownRenderer').then(module => ({
    default: module.default
  }))
);

interface GeneratedPromptDisplayProps {
  generatedPrompt: string;
  showGeneratedPrompt: boolean;
  isPromptMinimized: boolean;
  setShowGeneratedPrompt: (val: boolean) => void;
  setIsPromptMinimized: (val: boolean) => void;
}

const GeneratedPromptDisplay: React.FC<GeneratedPromptDisplayProps> = ({
  generatedPrompt,
  showGeneratedPrompt,
  isPromptMinimized,
  setShowGeneratedPrompt,
  setIsPromptMinimized
}) => (
  <AnimatePresence>
    {showGeneratedPrompt && (
      <motion.div
        className="card bg-base-300"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
      >
        <div className="card-body max-h-[400px] overflow-y-auto">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Generated Prompt</h3>
            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => navigator.clipboard.writeText(generatedPrompt)}
              >
                Copy to Clipboard
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setIsPromptMinimized(!isPromptMinimized)}
              >
                {isPromptMinimized ? (
                  <FiMaximize2 className="w-4 h-4" />
                ) : (
                  <FiMinimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setShowGeneratedPrompt(false)}
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Suspense fallback={<div className="loading loading-spinner">Loading...</div>}>
            <MarkdownRenderer content={generatedPrompt} />
          </Suspense>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default GeneratedPromptDisplay;
