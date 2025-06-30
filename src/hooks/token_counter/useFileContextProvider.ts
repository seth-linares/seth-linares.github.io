// src/hooks/token_counter/useFileContextProvider.ts

import { useState, useEffect, useCallback } from "react";
import { getLanguageFromExtension } from "@/utils/getLanguageFromExtension";
import { readFileAsText } from "@/utils/fileHelpers";

export const useFileContextProvider = () => {
    const [fileText, setFileText] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());

    const removeFile = useCallback(async (index: number) => {
        const fileToRemove = files[index];
        if (!fileToRemove) return;

        setFiles(prevFiles => {
            const newFiles = prevFiles.filter((_, i) => i !== index);
            // Update fileContents after files are removed
            setFileContents(prevContents => {
                const newContents = new Map(prevContents);
                // Only remove this specific file's content
                newContents.delete(fileToRemove.name);
                return newContents;
            });
            
            // Update combined fileText based on remaining files in fileContents
            Promise.all(newFiles.map(file => readFileAsText(file)))
                .then(contents => {
                    setFileText(contents.join('\n'));
                });
            
            return newFiles;
        });
    }, [files]);

    const generatePrompt = useCallback((userPrompt: string) => {
        let prompt = '';
        
        console.log('Generating prompt with:', {
            fileContentsSize: fileContents.size,
            fileNames: Array.from(fileContents.keys()),
            filesLength: files.length
        });
        
        // Ensure we only include contents for files that still exist
        const activeFileNames = new Set(files.map(f => f.name));
        
        // Add file contents with code fence blocks
        Array.from(fileContents.entries())
            .filter(([fileName]) => activeFileNames.has(fileName))
            .forEach(([fileName, content]) => {
                const language = getLanguageFromExtension(fileName);
                prompt += `## \`${fileName}\`\n\n\`\`\`\`${language}\n${content}\n\`\`\`\`\n\n`;
            });

        // Add separator and user prompt if provided
        if (userPrompt.trim()) {
            prompt += `---\n\n## User Prompt:\n\n${userPrompt.trim()}\n`;
        }

        return prompt.trim();
    }, [fileContents, files]);

    useEffect(() => {
      console.log("FileContextProvider render - fileText length:", fileText.length, "files count:", files.length);
    }, [fileText, files]);

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
}