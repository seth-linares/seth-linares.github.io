// src/components/TokenCounter.tsx

import useTokenCounter from '@/hooks/token_counter/useTokenCounter';
import useFileContext from '@/hooks/token_counter/useFileContext';
import { FiHash, FiRefreshCw } from 'react-icons/fi';
import { motion, AnimatePresence } from 'motion/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FileUploader from './FileUploader';
import ApiKeyForm from './ApiKeyForm';
import TokenCountDisplay from './TokenCountDisplay';
import GeneratedPromptDisplay from './GeneratedPromptDisplay';

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
        handleGeneratePrompt,
        setShowGeneratedPrompt,
        setIsPromptMinimized,
        isSectionLoading,
    } = useTokenCounter();

    // Skeleton loader component
    const SectionSkeleton = () => (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Textarea skeleton */}
            <div className="h-32 bg-base-300 rounded w-full mb-2" />
            {/* Actions row skeleton */}
            <div className="flex flex-wrap gap-6 items-start justify-between">
                {/* Upload button skeleton (left) */}
                <div className="w-full md:w-1/3 flex gap-2">
                    <div className="h-12 w-full bg-base-300 rounded" />
                </div>
                {/* Action buttons skeleton (right) */}
                <div className="flex items-center ml-auto gap-2">
                    <div className="h-12 w-36 bg-base-300 rounded" />
                    <div className="h-12 w-32 bg-base-300 rounded" />
                </div>
            </div>
        </motion.div>
    );

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
                        {isSectionLoading ? (
                            <SectionSkeleton />
                        ) : !apiKey ? (
                            <ApiKeyForm 
                                apiKeyInput={apiKeyInput}
                                setApiKeyInput={setApiKeyInput}
                                localSaveApiKey={localSaveApiKey}
                            />
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
                                <TokenCountDisplay tokenCount={tokenCount} />

                                {/* Generated Prompt Display */}
                                <GeneratedPromptDisplay
                                    generatedPrompt={generatedPrompt}
                                    showGeneratedPrompt={showGeneratedPrompt}
                                    isPromptMinimized={isPromptMinimized}
                                    setShowGeneratedPrompt={setShowGeneratedPrompt}
                                    setIsPromptMinimized={setIsPromptMinimized}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default TokenCounter;
