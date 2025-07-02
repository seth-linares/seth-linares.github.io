import { FileContextType } from "@/types/general_types";
import { createContext } from "react";

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