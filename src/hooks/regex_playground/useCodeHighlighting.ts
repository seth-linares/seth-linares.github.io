// src/hooks/regex_playground/useCodeHighlighting.ts

import { useState, useEffect, useRef, useMemo, RefObject } from 'react';
import type { RegexFlags } from '@/types/regex';
import { generatePythonCode, generateJavaCode, generateCSharpCode, generateTypeScriptCode } from '@/utils/regex/codeGenerators';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import typescript from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/github-dark.css';

// Register languages once
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('typescript', typescript);

export type SupportedLanguage = 'javascript' | 'python' | 'java' | 'csharp' | 'typescript';

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

  const displayCode = useMemo(() => {
    switch (language) {
      case 'python':
        return generatePythonCode({ pattern, flags });
      case 'java':
        return generateJavaCode({ pattern, flags });
      case 'csharp':
        return generateCSharpCode({ pattern, flags });
      case 'typescript':
        return generateTypeScriptCode({ pattern, flags });
      default:
        return code;
    }
  }, [language, pattern, flags, code]);

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