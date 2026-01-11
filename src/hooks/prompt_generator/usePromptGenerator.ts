// src/hooks/prompt_generator/usePromptGenerator.ts

import { useCallback, useState, useMemo } from 'react';
import Anthropic, { AnthropicError } from '@anthropic-ai/sdk';
import { toast } from 'react-toastify';
import { formatAnthropicError } from '@/types/AnthropicErrors';
import useFileContext from './useFileContext';

interface GeneratedPromptData {
    prompt: string;
    sourceFileText: string;
}

function usePromptGenerator() {
    const { fileText, generatePrompt } = useFileContext();

    const [promptInput, setPromptInput] = useState('');
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [tokenCount, setTokenCount] = useState<number | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(() =>
        localStorage.getItem('anthropic-api-key')
    );

    const client = useMemo(() => {
        return apiKey ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true }) : null;
    }, [apiKey]);

    const [generatedPromptData, setGeneratedPromptData] = useState<GeneratedPromptData | null>(
        null
    );
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [isPromptMinimized, setIsPromptMinimized] = useState(false);
    const [isApiKeyFormExpanded, setIsApiKeyFormExpanded] = useState(false);

    const isPromptValid =
        generatedPromptData !== null && generatedPromptData.sourceFileText === fileText;

    const generatedPrompt = isPromptValid ? generatedPromptData.prompt : '';
    const showGeneratedPrompt = isPromptValid && isPromptVisible;

    const setShowGeneratedPrompt = useCallback((show: boolean) => {
        setIsPromptVisible(show);
    }, []);

    const handleGeneratePrompt = useCallback(() => {
        const prompt = generatePrompt(promptInput);
        setGeneratedPromptData({ prompt, sourceFileText: fileText });
        setIsPromptVisible(true);
    }, [promptInput, generatePrompt, fileText]);

    const localSaveApiKey = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!apiKeyInput) return;

            localStorage.setItem('anthropic-api-key', apiKeyInput);
            setApiKey(apiKeyInput);
            setIsApiKeyFormExpanded(false);
        },
        [apiKeyInput]
    );

    const resetApiKey = useCallback(() => {
        localStorage.removeItem('anthropic-api-key');
        setApiKey(null);
        setApiKeyInput('');
        setIsApiKeyFormExpanded(true);
    }, []);

    const handleSubmitTokens = useCallback(
        async (e: React.FormEvent) => {
            if (e) e.preventDefault();

            try {
                if (!client) {
                    toast.error('Please enter your API key to count tokens');
                    return;
                }

                const combinedText = `${promptInput}${fileText ? '\n' + fileText : ''}`.trim();

                if (!combinedText) {
                    toast.error('No text to count');
                    return;
                }

                const result = await client.messages.countTokens({
                    model: 'claude-sonnet-4-20250514',
                    messages: [{ role: 'user', content: combinedText }],
                });
                setTokenCount(result.input_tokens);
            } catch (error) {
                if (error instanceof AnthropicError) {
                    toast.error(formatAnthropicError(error), { autoClose: 2000, theme: 'colored' });
                } else {
                    toast.error(`Unknown error: ${error}`, { autoClose: 2000, theme: 'colored' });
                }
            }
        },
        [client, promptInput, fileText]
    );

    return {
        promptInput,
        setPromptInput,
        apiKeyInput,
        setApiKeyInput,
        apiKey,
        tokenCount,
        generatedPrompt,
        showGeneratedPrompt,
        isPromptMinimized,
        isApiKeyFormExpanded,
        setShowGeneratedPrompt,
        setIsPromptMinimized,
        setIsApiKeyFormExpanded,
        localSaveApiKey,
        resetApiKey,
        handleSubmitTokens,
        handleGeneratePrompt,
    };
}

export default usePromptGenerator;
