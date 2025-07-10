// src/hooks/prompt_generator/usePromptGenerator.ts

import { useCallback, useState, useEffect, useRef } from "react";
import Anthropic, { AnthropicError } from "@anthropic-ai/sdk";
import { toast } from "react-toastify";
import { formatAnthropicError } from "@/types/AnthropicErrors";
import useFileContext from "./useFileContext";

function usePromptGenerator() {

    const { fileText, generatePrompt } = useFileContext();
    const fileTextRef = useRef(fileText);

    const [promptInput, setPromptInput] = useState('');
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [tokenCount, setTokenCount] = useState<number | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [client, setClient] = useState<Anthropic | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [showGeneratedPrompt, setShowGeneratedPrompt] = useState(false);
    const [isPromptMinimized, setIsPromptMinimized] = useState(false);
    const [isApiKeyFormExpanded, setIsApiKeyFormExpanded] = useState(false);

    const handleGeneratePrompt = useCallback(() => {
        const prompt = generatePrompt(promptInput);
        setGeneratedPrompt(prompt);
        setShowGeneratedPrompt(true);
    }, [promptInput, generatePrompt]);

    useEffect(() => {
        setShowGeneratedPrompt(false);
        setGeneratedPrompt('');
    }, [fileText]);

    useEffect(() => {
        const storedApiKey = localStorage.getItem('anthropic-api-key');
        setApiKey(storedApiKey);
        if (storedApiKey) {
            setClient(new Anthropic({ apiKey: storedApiKey, dangerouslyAllowBrowser: true }));
        } else {
            setClient(null);
        }
    }, []);


    useEffect(() => {
        fileTextRef.current = fileText;
    }, [fileText]);

    const localSaveApiKey = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKeyInput) return;
        
        localStorage.setItem('anthropic-api-key', apiKeyInput);
        setApiKey(apiKeyInput);
        setClient(new Anthropic({ apiKey: apiKeyInput, dangerouslyAllowBrowser: true }));
        setIsApiKeyFormExpanded(false);
    }, [apiKeyInput]);

    const resetApiKey = useCallback(() => {
        localStorage.removeItem('anthropic-api-key');
        setApiKey(null);
        setApiKeyInput('');
        setClient(null);
        setIsApiKeyFormExpanded(true);
    }, []);

    const handleSubmitTokens = useCallback(async (e: React.FormEvent) => {
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
                model: "claude-sonnet-4-20250514",
                messages: [{ role: "user", content: combinedText }]
            });
            setTokenCount(result.input_tokens);

        } catch (error) {
            if (error instanceof AnthropicError) {
                toast.error(
                    formatAnthropicError(error),
                    { autoClose: 2000, theme: 'colored' }
                )
            } else {
                toast.error(
                    `Unknown error: ${error}`,
                    { autoClose: 2000, theme: 'colored' }
                )
            }
        }
    }, [client, promptInput, fileText]);

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
};

export default usePromptGenerator;
