// src/components/TokenCounter.tsx

import useTokenCounter from '@/hooks/token_counter/useTokenCounter';
import useFileContext from '@/hooks/token_counter/useFileContext';
import { FiKey, FiHash, FiRefreshCw, FiMinimize2, FiMaximize2, FiX } from 'react-icons/fi';  // Add these imports
import { motion, AnimatePresence } from 'motion/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FileUploader from './FileUploader';
import { Suspense, lazy } from 'react';

// Dynamic import of MarkdownRenderer
const MarkdownRenderer = lazy(() => 
  import('@/components/token_counter/MarkdownRenderer').then(module => ({
    default: module.default
  }))
);

function TokenCounter() {
    const { fileText } = useFileContext();
    const { 
        promptInput,
        apiKeyInput,
        apiKey,
        tokenCount,
        generatedPrompt,
        showGeneratedPrompt,
        isPromptMinimized,
        setPromptInput,
        setApiKeyInput,
        localSaveApiKey,
        resetApiKey,
        handleSubmitTokens,
        handleGeneratePrompt,  // <-- This wasn't being used correctly
        setShowGeneratedPrompt,
        setIsPromptMinimized,
    } = useTokenCounter();


    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-base-200 py-12 px-4 grid place-items-center"
        >
            <ToastContainer
                position="top-center"
                hideProgressBar
                className="!font-sans"
            />
            <motion.div 
                className="card bg-base-100 shadow-xl w-full max-w-5xl"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <div className="card-body space-y-6">
                    {/* Header Area with API Key Change Button */}
                    <div className="flex items-center justify-between">
                        <motion.h2 
                            className="card-title text-3xl font-bold flex items-center gap-2"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <FiHash className="w-8 h-8 text-primary" />
                            Claude Token Counter
                        </motion.h2>
                        {apiKey && (
                            <motion.button 
                                type="button" 
                                className="btn btn-outline btn-info btn-sm gap-2 hover:scale-105 transition-transform"
                                onClick={resetApiKey}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                Change API Key
                            </motion.button>
                        )}
                    </div>

                    <div className="divider m-0"></div>
                    
                    <AnimatePresence mode="wait">
                        {!apiKey ? (
                            <motion.div
                                key="api-form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="card bg-base-200 p-6 "
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <FiKey className="w-6 h-6 text-primary" />
                                    <h3 className="text-xl font-semibold">Enter your Anthropic API Key</h3>
                                </div>
                                <form onSubmit={localSaveApiKey} className="form-control gap-6">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="input input-bordered w-full pr-10 transition-all duration-200 focus:input-primary"
                                                    placeholder="Enter API Key..."
                                                    value={apiKeyInput}
                                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                                />
                                                <div className="absolute inset-y-0 right-3 flex items-center">
                                                    <FiKey className="w-4 h-4 text-base-content/50" />
                                                </div>
                                            </div>
                                        </div>
                                        <motion.button 
                                            type="submit" 
                                            className="btn btn-primary whitespace-nowrap"
                                            disabled={!apiKeyInput}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Save API Key
                                        </motion.button>
                                    </div>
                                    <div className="text-center mt-2">
                                        <span className="label-text-alt text-base-content/70">
                                            Your API key is stored locally and never sent to any server
                                        </span>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="token-counter"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Text Input Area */}
                                <form onSubmit={handleSubmitTokens} className="space-y-4">
                                    <div className="form-control w-full">
                                        <motion.textarea 
                                            className="textarea textarea-bordered min-h-[200px] text-lg transition-all duration-200 focus:textarea-primary w-full"
                                            value={promptInput}
                                            onChange={(e) => setPromptInput(e.target.value)}
                                            placeholder="Enter text to count tokens..."
                                            initial={{ height: 200 }}
                                            animate={{ height: promptInput ? 300 : 200 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    </div>
                                </form>

                                {/* Actions Area */}
                                <div className="flex flex-wrap gap-6 items-start justify-between">
                                    <div className="w-full md:w-1/3">
                                        <FileUploader />
                                    </div>
                                    
                                    <div className="flex items-center ml-auto gap-2">
                                        <motion.button 
                                            type="button" 
                                            className="btn btn-primary gap-2 min-w-[300px]"
                                            onClick={handleSubmitTokens}
                                            disabled={!promptInput && !fileText}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <FiHash className="w-5 h-5" />
                                            Count Tokens
                                        </motion.button>
                                        <motion.button 
                                            type="button" 
                                            className="btn btn-secondary gap-2"
                                            onClick={() => handleGeneratePrompt()}
                                            disabled={!fileText}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Generate Prompt
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Token Count Display */}
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
                                                        {tokenCount.toLocaleString()}
                                                    </motion.span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Generated Prompt Display */}
                                <AnimatePresence>
                                    {showGeneratedPrompt && (
                                        <motion.div 
                                            className="card bg-base-200"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <div className="card-body">
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
                                                            {isPromptMinimized ? 
                                                                <FiMaximize2 className="w-4 h-4" /> : 
                                                                <FiMinimize2 className="w-4 h-4" />
                                                            }
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default TokenCounter;
