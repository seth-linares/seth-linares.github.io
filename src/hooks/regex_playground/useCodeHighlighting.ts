// src/hooks/regex_playground/useCodeHighlighting.ts

import { useState, useEffect, useRef, RefObject } from 'react';
import type { RegexFlags } from '@/types/regex';
import { generatePythonCode, generateJavaCode } from '@/utils/regex/codeGenerators';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import 'highlight.js/styles/github-dark.css';

// Register languages once
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);

export type SupportedLanguage = 'javascript' | 'python' | 'java';

interface UseCodeHighlightingOptions {
  code: string;
  pattern: string;
  flags: RegexFlags;
}

interface UseCodeHighlightingReturn {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  displayCode: string;
  codeRef: RefObject<HTMLElement | null>;
}

export function useCodeHighlighting({
  code,
  pattern,
  flags,
}: UseCodeHighlightingOptions): UseCodeHighlightingReturn {
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const codeRef = useRef<HTMLElement>(null);

  const getCode = () => {
    switch (language) {
      case 'python':
        return generatePythonCode({ pattern, flags });
      case 'java':
        return generateJavaCode({ pattern, flags });
      default:
        return code;
    }
  };

  const displayCode = getCode();

  // Apply syntax highlighting when code or language changes
  useEffect(() => {
    if (codeRef.current && displayCode) {
      // Remove existing highlighting classes
      codeRef.current.className = `language-${language}`;
      codeRef.current.removeAttribute('data-highlighted');
      
      // Apply highlight.js
      hljs.highlightElement(codeRef.current);
    }
  }, [displayCode, language]);

  return {
    language,
    setLanguage,
    displayCode,
    codeRef,
  };
}