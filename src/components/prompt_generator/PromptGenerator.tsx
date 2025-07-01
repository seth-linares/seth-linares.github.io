// src/components/PromptGenerator.tsx

import usePromptGenerator from '@/hooks/prompt_generator/usePromptGenerator';
import useFileContext from '@/hooks/prompt_generator/useFileContext';
import { FiHash, FiRefreshCw, FiKey } from 'react-icons/fi';
import { motion } from 'motion/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FileUploader from './FileUploader';
import ApiKeyForm from './ApiKeyForm';
import TokenCountDisplay from './TokenCountDisplay';
import GeneratedPromptDisplay from './GeneratedPromptDisplay';

function PromptGenerator() {
    const { fileText } = useFileContext();
    const {
        promptInput,
        apiKeyInput,
        apiKey,
        tokenCount,
        generatedPrompt,
        showGeneratedPrompt,
        isPromptMinimized,
        isApiKeyFormExpanded,
        setPromptInput,
        setApiKeyInput,
        setIsApiKeyFormExpanded,
        localSaveApiKey,
        resetApiKey,
        handleSubmitTokens,
        handleGeneratePrompt,
        setShowGeneratedPrompt,
        setIsPromptMinimized,
    } = usePromptGenerator();

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
                    {/* Header Area with API Key Button */}
                    <div className="flex items-center justify-between">
                        <motion.h2 
                            className="card-title text-3xl font-bold flex items-center gap-2"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <FiHash className="w-8 h-8 text-primary" />
                            Prompt Builder
                        </motion.h2>
                        <motion.button 
                            type="button" 
                            className="btn btn-outline btn-info btn-sm gap-2"
                            onClick={() => apiKey ? resetApiKey() : setIsApiKeyFormExpanded(!isApiKeyFormExpanded)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {apiKey ? <FiRefreshCw className="w-4 h-4" /> : <FiKey className="w-4 h-4" />}
                            {apiKey ? 'Change API Key' : 'Add API Key'}
                        </motion.button>
                    </div>
                    <div className="divider m-0"></div>
                    
                    {/* API Key Form - Collapsible */}
                    {(!apiKey && isApiKeyFormExpanded) && (
                        <ApiKeyForm 
                            apiKeyInput={apiKeyInput}
                            setApiKeyInput={setApiKeyInput}
                            localSaveApiKey={localSaveApiKey}
                        />
                    )}
                    
                    <motion.div
                                key="prompt-generator"
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
                                            placeholder="Enter your prompt text..."
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
                                            className={`btn gap-2 min-w-[300px] ${!apiKey ? 'btn-disabled' : 'btn-primary'}`}
                                            onClick={handleSubmitTokens}
                                            disabled={!apiKey || (!promptInput && !fileText)}
                                            whileHover={apiKey ? { scale: 1.02 } : {}}
                                            whileTap={apiKey ? { scale: 0.98 } : {}}
                                        >
                                            <FiHash className="w-5 h-5" />
                                            {!apiKey ? 'Count Tokens (API Key Required)' : 'Count Tokens'}
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
                </div>
            </motion.div>
        </motion.div>
    );
}

export default PromptGenerator;