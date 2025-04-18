// src/hooks/token_counter/useMarkdownRenderer.ts

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';

interface UseMarkdownRendererProps {
  content: string;
}

function useMarkdownRenderer({ content }: UseMarkdownRendererProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [content]);

  return { codeRef };
}

export default useMarkdownRenderer;
