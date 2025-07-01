// src/components/prompt_generator/GeneratedPromptDisplay.tsx

import { motion, AnimatePresence } from 'motion/react';
import { Suspense, lazy } from 'react';
import { FiMaximize2, FiMinimize2, FiX, FiArrowUp, FiArrowDown, FiCopy, FiCheck, FiList, FiCode, FiFileText, FiSettings } from 'react-icons/fi';
import { SiJavascript, SiTypescript, SiPython, SiMarkdown, SiJson, SiCss3, SiHtml5, SiReact } from 'react-icons/si';
import { useGeneratedPromptDisplay } from '@/hooks/prompt_generator/useGeneratedPromptDisplay';

const MarkdownRenderer = lazy(() =>
  import('@/components/prompt_generator/MarkdownRenderer').then(module => ({
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

// Helper function to get file icon and badge style based on extension
const getFileIconAndStyle = (fileName: string) => {
  const ext = fileName.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'js':
      return { icon: SiJavascript, badgeClass: 'badge-warning' };
    case 'ts':
    case 'tsx':
      return { icon: SiTypescript, badgeClass: 'badge-info' };
    case 'jsx':
      return { icon: SiReact, badgeClass: 'badge-accent' };
    case 'py':
      return { icon: SiPython, badgeClass: 'badge-success' };
    case 'md':
      return { icon: SiMarkdown, badgeClass: 'badge-neutral' };
    case 'json':
      return { icon: SiJson, badgeClass: 'badge-warning' };
    case 'css':
      return { icon: SiCss3, badgeClass: 'badge-info' };
    case 'html':
      return { icon: SiHtml5, badgeClass: 'badge-error' };
    case 'config':
    case 'conf':
    case 'env':
      return { icon: FiSettings, badgeClass: 'badge-secondary' };
    default:
      return { icon: FiFileText, badgeClass: 'badge-ghost' };
  }
};

const GeneratedPromptDisplay: React.FC<GeneratedPromptDisplayProps> = ({
  generatedPrompt,
  showGeneratedPrompt,
  isPromptMinimized,
  setShowGeneratedPrompt,
  setIsPromptMinimized
}) => {
  const {
    copied,
    showFileNav,
    setShowFileNav,
    scrollContainerRef,
    canScrollUp,
    canScrollDown,
    fileCheckpoints,
    handleCopy,
    scrollToTop,
    scrollToBottom,
    scrollToFile
  } = useGeneratedPromptDisplay({
    generatedPrompt,
    showGeneratedPrompt,
    isPromptMinimized
  });

  return (
    <AnimatePresence>
      {showGeneratedPrompt && (
        <motion.div
          className="card bg-base-300 relative"
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: 1, 
            height: isPromptMinimized ? "auto" : "auto"
          }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="card-body p-0">
            {/* Header */}
            <div className="p-4 border-b border-base-content/10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="text-lg font-semibold">Generated Prompt</h3>
                <div className="flex flex-wrap gap-2">
                  {fileCheckpoints.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        btn btn-sm transition-all duration-200 relative overflow-hidden
                        ${showFileNav 
                          ? 'btn-primary shadow-md' 
                          : 'btn-ghost hover:bg-primary/10 hover:border-primary/20'
                        }
                      `}
                      onClick={() => setShowFileNav(!showFileNav)}
                      title="Navigate to files"
                    >
                      <motion.div
                        animate={{ rotate: showFileNav ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FiList className="w-4 h-4" />
                      </motion.div>
                      <span className="ml-1 hidden sm:inline">Files</span>
                      {/* Pulse effect when active */}
                      {showFileNav && (
                        <motion.div
                          className="absolute inset-0 bg-primary/20 rounded-lg"
                          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  )}
                  <button
                    className={`btn btn-sm btn-ghost ${copied ? 'btn-success' : ''}`}
                    onClick={handleCopy}
                    disabled={copied}
                  >
                    {copied ? (
                      <>
                        <FiCheck className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setIsPromptMinimized(!isPromptMinimized)}
                    title={isPromptMinimized ? 'Expand' : 'Minimize'}
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
                    title="Close"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* File Navigation */}
              <AnimatePresence>
                {showFileNav && fileCheckpoints.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-4"
                  >
                    <div className="card bg-base-200 shadow-lg border border-base-content/10">
                      <div className="card-body p-4">
                        <div className="text-sm font-medium flex items-center gap-2 mb-3">
                          <FiCode className="w-4 h-4" />
                          Jump to file:
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {fileCheckpoints.map((checkpoint, index) => {
                              const { icon: Icon, badgeClass } = getFileIconAndStyle(checkpoint.fileName);
                              return (
                                <motion.button
                                  key={checkpoint.fileName}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05, duration: 0.2 }}
                                  whileHover={{ 
                                    scale: 1.005,
                                    transition: { duration: 0.1 }
                                  }}
                                  whileTap={{ scale: 0.995 }}
                                  className="btn btn-ghost btn-sm justify-start h-auto p-2 group"
                                  onClick={() => scrollToFile(checkpoint.fileName)}
                                  title={checkpoint.fileName}
                                >
                                  <div className="flex items-center gap-2 min-w-0 w-full">
                                    <div className={`badge ${badgeClass} badge-sm p-1`}>
                                      <Icon className="w-3 h-3" />
                                    </div>
                                    <span className="text-xs font-medium truncate flex-1 text-left group-hover:text-primary transition-colors">
                                      {checkpoint.fileName}
                                    </span>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!isPromptMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <div 
                    ref={scrollContainerRef}
                    className="max-h-[60vh] min-h-[200px] overflow-y-auto p-4 relative"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-8">
                        <div className="loading loading-spinner loading-md"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    }>
                      <MarkdownRenderer content={generatedPrompt} />
                    </Suspense>
                  </div>
                  
                  {/* Scroll Controls */}
                  <div className="absolute right-2 top-2 flex flex-col gap-1">
                    <AnimatePresence>
                      {canScrollUp && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="btn btn-sm btn-circle btn-ghost bg-base-100/80 hover:bg-base-100 shadow-md"
                          onClick={scrollToTop}
                          title="Scroll to top"
                        >
                          <FiArrowUp className="w-4 h-4" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {canScrollDown && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="btn btn-sm btn-circle btn-ghost bg-base-100/80 hover:bg-base-100 shadow-md"
                          onClick={scrollToBottom}
                          title="Scroll to bottom"
                        >
                          <FiArrowDown className="w-4 h-4" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GeneratedPromptDisplay;
