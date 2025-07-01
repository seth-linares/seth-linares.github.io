// src/hooks/prompt_generator/useFileContext.ts

import { useContext } from 'react';
import FileContext from '@/contexts/FileContext';

function useFileContext() {
  const context = useContext(FileContext);
  
  if (!context) {
    throw new Error('useFileContext must be used within a FileContextProvider');
  }
  
  return context;
}

export default useFileContext;