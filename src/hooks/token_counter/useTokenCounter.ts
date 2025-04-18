// src/hooks/token_counter/useTokenCounter.ts

import { useCallback, useState, useEffect, useRef } from "react";
import Anthropic, { AnthropicError } from "@anthropic-ai/sdk";
import { toast } from "react-toastify";
import { formatAnthropicError } from "@/types/AnthropicErrors";
import useFileContext from "./useFileContext";

function useTokenCounter() {

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
    const [isSectionLoading, setIsSectionLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setIsSectionLoading(false), 600); // 600ms for a smooth effect
        return () => clearTimeout(timer);
    }, [apiKey]);

    const handleGeneratePrompt = useCallback(() => {
        console.log('handleGeneratePrompt called with promptInput:', promptInput);
        const prompt = generatePrompt(promptInput);
        console.log('Generated prompt:', { length: prompt.length, preview: prompt.slice(0, 100) + '...' });
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
        console.log('Current file text in context:', fileText);
    }, [fileText]);

    useEffect(() => {
        console.log("TokenCounter - fileText changed:", fileText);
    }, [fileText]);

    useEffect(() => {
        if (fileText) {
            console.log("TokenCounter - Received file text:", {
                length: fileText.length,
                preview: fileText.slice(0, 50) + '...'
            });
        }
    }, [fileText]);

    useEffect(() => {
        fileTextRef.current = fileText;
        console.log("TokenCounter - fileText updated:", {
            length: fileText?.length,
            preview: fileText?.slice(0, 50)
        });
    }, [fileText]);

    const localSaveApiKey = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKeyInput) return;
        
        localStorage.setItem('anthropic-api-key', apiKeyInput);
        setApiKey(apiKeyInput);
        setClient(new Anthropic({ apiKey: apiKeyInput, dangerouslyAllowBrowser: true }));
    }, [apiKeyInput]);

    const resetApiKey = useCallback(() => {
        localStorage.removeItem('anthropic-api-key');
        setApiKey(null);
        setApiKeyInput('');
        setClient(null);
    }, []);

    const handleSubmitTokens = useCallback(async (e: React.FormEvent) => {
        if (e) e.preventDefault();

        try {
            if (!client) {
                toast.error('API key not set');
                return;
            }
            
            const combinedText = `${promptInput}${fileText ? '\n' + fileText : ''}`.trim();
            
            console.log("Submitting with:", {
                promptLength: promptInput.length,
                fileTextLength: fileText.length,
                combinedLength: combinedText.length
            });

            if (!combinedText) {
                toast.error('No text to count');
                return;
            }

            const result = await client.messages.countTokens({
                model: "claude-3-5-sonnet-20241022",
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
        setShowGeneratedPrompt,
        setIsPromptMinimized,
        localSaveApiKey,
        resetApiKey,
        handleSubmitTokens,
        handleGeneratePrompt,
        isSectionLoading,
    };
};

export default useTokenCounter;
