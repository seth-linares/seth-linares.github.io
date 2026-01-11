// src/hooks/prompt_generator/useFileContextProvider.ts

import { useState, useCallback, useMemo } from 'react';
import { getLanguageFromExtension } from '@/utils/getLanguageFromExtension';
import { readFileAsText } from '@/utils/fileHelpers';

export const useFileContextProvider = () => {
    const [fileText, setFileText] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());

    const removeFile = useCallback(
        async (index: number) => {
            const fileToRemove = files[index];
            if (!fileToRemove) return;

            setFiles((prevFiles) => {
                const newFiles = prevFiles.filter((_, i) => i !== index);
                setFileContents((prevContents) => {
                    const newContents = new Map(prevContents);
                    newContents.delete(fileToRemove.name);
                    return newContents;
                });

                Promise.all(newFiles.map((file) => readFileAsText(file))).then((contents) => {
                    setFileText(contents.join('\n'));
                });

                return newFiles;
            });
        },
        [files]
    );

    const activeFileNames = useMemo(() => new Set(files.map((f) => f.name)), [files]);

    const activeFileContents = useMemo(
        () =>
            Array.from(fileContents.entries()).filter(([fileName]) =>
                activeFileNames.has(fileName)
            ),
        [fileContents, activeFileNames]
    );

    const generatePrompt = useCallback(
        (userPrompt: string) => {
            let prompt = '';

            activeFileContents.forEach(([fileName, content]) => {
                const language = getLanguageFromExtension(fileName);
                prompt += `## \`${fileName}\`\n\n\`\`\`\`${language}\n${content}\n\`\`\`\`\n\n`;
            });

            if (userPrompt.trim()) {
                prompt += `---\n\n## User Prompt:\n\n${userPrompt.trim()}\n`;
            }

            return prompt.trim();
        },
        [activeFileContents]
    );

    return {
        fileText,
        files,
        setFileText,
        setFiles,
        removeFile,
        fileContents,
        setFileContents,
        generatePrompt,
    };
};
