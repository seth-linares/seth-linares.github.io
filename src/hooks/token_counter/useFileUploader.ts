import { useState, useRef, useEffect, useCallback } from 'react';
import useFileContext from './useFileContext';
import { readFileAsText, generateUniqueName } from '@/utils/fileHelpers';

const useFileUploader = () => {
  const { files, setFileText, setFiles, setFileContents } = useFileContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = useCallback(async (event: Event) => {
    const newFiles = Array.from((event.target as HTMLInputElement).files || []);
    console.log("useFileUploader - Files selected:", newFiles.map(file => file.name));
    
    if (newFiles.length > 0) {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize with already uploaded file names.
        const currentNames = new Set(files.map(file => file.name));
        const existingNames = new Set(currentNames);
        const fileContentMap = new Map<string, string>();

        const contents = await Promise.all(newFiles.map(async file => {
          const content = await readFileAsText(file);
          const uniqueName = generateUniqueName(file, existingNames);
          fileContentMap.set(uniqueName, content);
          return content;
        }));

        // Create new File objects with unique names.
        const uniqueFiles = Array.from(fileContentMap.entries()).map(([uniqueName, content]) => {
          return new File([content], uniqueName, { type: 'text/plain' });
        });

        const newCombinedContents = contents.join('\n');
        console.log("useFileUploader - Combined file content length:", newCombinedContents.length);
        
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
