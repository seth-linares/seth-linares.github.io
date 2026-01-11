import { FileContextType } from '@/types/components';
import { createContext } from 'react';

const FileContext = createContext<FileContextType>({
    fileText: '',
    setFileText: () => {},
    files: [],
    setFiles: () => {},
    removeFile: () => {},
    fileContents: new Map(),
    setFileContents: () => {},
    generatePrompt: () => '',
});

export default FileContext;
