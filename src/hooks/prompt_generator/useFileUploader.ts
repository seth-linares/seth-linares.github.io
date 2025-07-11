// src/hooks/prompt_generator/useFileUploader.ts

import { useState, useRef, useEffect, useCallback } from 'react';
import useFileContext from './useFileContext';
import { readFileAsText, generateUniqueName } from '@/utils/fileHelpers';

// Set max file size to 10MB (change to 5 * 1024 * 1024 for 5MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const useFileUploader = () => {
  const { files, setFileText, setFiles, setFileContents } = useFileContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = useCallback(async (event: Event) => {
    const newFiles = Array.from((event.target as HTMLInputElement).files || []);
    
    if (newFiles.length > 0) {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize with already uploaded file names.
        const currentNames = new Set(files.map(file => file.name));
        const existingNames = new Set(currentNames);
        const fileContentMap = new Map<string, string>();
        const validFiles: File[] = [];
        const skippedFiles: string[] = [];

        for (const file of newFiles) {
          if (file.size > MAX_FILE_SIZE) {
            console.warn(`File '${file.name}' skipped: exceeds max size (${MAX_FILE_SIZE} bytes)`);
            skippedFiles.push(file.name + ' (too large)');
            continue;
          }
          validFiles.push(file);
        }

        if (skippedFiles.length > 0) {
          console.info('Skipped files:', skippedFiles);
        }

        // Batch read and process valid files (allowing duplicate names with unique suffixes)
        const results = await Promise.allSettled(validFiles.map(async file => {
          const content = await readFileAsText(file);
          const uniqueName = generateUniqueName(file, existingNames);
          return { uniqueName, content };
        }));

        // Filter out rejected promises and process successful ones
        const successfulResults = results
          .filter((result): result is PromiseFulfilledResult<{uniqueName: string, content: string}> => 
            result.status === 'fulfilled');

        successfulResults.forEach(result => {
          fileContentMap.set(result.value.uniqueName, result.value.content);
        });

        const newCombinedContents = successfulResults
          .map(result => result.value.content)
          .filter(content => content) // Remove any undefined/null values
          .join('\n');

        // Create new File objects with unique names.
        const uniqueFiles = Array.from(fileContentMap.entries()).map(([uniqueName, content]) => {
          return new File([content], uniqueName, { type: 'text/plain' });
        });

        
        // Batch state updates
        setFiles(prevFiles => [...prevFiles, ...uniqueFiles]);
        setFileContents(prevContents => {
          const newContents = new Map(prevContents);
          for (const [fileName, content] of fileContentMap) {
            newContents.set(fileName, content);
          }
          return newContents;
        });
        setFileText(prevText => prevText ? prevText + '\n' + newCombinedContents : newCombinedContents);
        
      } catch (err) {
        console.error('useFileUploader - File upload error:', err);
        setError(err as Error);
        setFiles([]);
        setFileText('');
      } finally {
        setIsLoading(false);
        if (event.target instanceof HTMLInputElement) {
          event.target.value = '';
        }
      }
    }
  }, [files, setFiles, setFileText, setFileContents]);

  useEffect(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';
    input.addEventListener('change', handleFileChange);
    inputRef.current = input;
    document.body.appendChild(input);

    return () => {
      input.removeEventListener('change', handleFileChange);
      document.body.removeChild(input);
    };
  }, [handleFileChange]);

  const selectFiles = () => {
    inputRef.current?.click();
  };

  const reset = () => {
    setFileText('');
    setFiles([]);
    setError(null);
  };

  return {
    isLoading,
    error,
    selectFiles,
    reset,
  };
};

export default useFileUploader;
