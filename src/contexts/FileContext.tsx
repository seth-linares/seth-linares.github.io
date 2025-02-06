// src/contexts/FileContext.tsx

import { createContext } from "react";

/*
  We type the setter functions as React.Dispatch<React.SetStateAction<T>>
  to allow both direct state assignment and functional updates. In other words,
  the setter can receive either a new state value directly or a function that takes
  the current state and returns the updated value. This flexibility is essential
  for operations like appending new items to an array which we do since we have the
  ability to add more files to the existing list.
*/
interface FileContextType {
  fileText: string;
  setFileText: React.Dispatch<React.SetStateAction<string>>;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  removeFile: (index: number) => void;
  fileContents: Map<string, string>;
  setFileContents: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  generatePrompt: (userPrompt: string) => string;
}

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