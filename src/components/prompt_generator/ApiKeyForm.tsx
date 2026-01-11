// src/components/prompt_generator/ApiKeyForm.tsx

import React from 'react';
import { FiKey } from 'react-icons/fi';
import { motion } from 'motion/react';
import { ApiKeyFormProps } from '@/types/components';

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({
    apiKeyInput,
    setApiKeyInput,
    localSaveApiKey,
}) => (
    <motion.div
        key="api-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="card bg-base-200 p-6 "
    >
        <div className="flex items-center gap-3 mb-4">
            <FiKey className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">Enter your Anthropic API Key (Optional)</h3>
        </div>
        <p className="text-sm text-base-content/70 mb-4">
            You can use the file uploader and prompt generator without an API key. The API key is
            only required for token counting.
        </p>
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
                <button
                    type="submit"
                    className="btn btn-primary whitespace-nowrap btn-animated"
                    disabled={!apiKeyInput}
                >
                    Save API Key
                </button>
            </div>
            <div className="text-center mt-2">
                <span className="label-text-alt text-base-content/70">
                    Your API key is stored locally and never sent to any server
                </span>
            </div>
        </form>
    </motion.div>
);

export default React.memo(ApiKeyForm);
