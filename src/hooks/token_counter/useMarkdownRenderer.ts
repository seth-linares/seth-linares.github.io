// src/hooks/token_counter/useMarkdownRenderer.ts

import { useRef } from 'react';

interface UseMarkdownRendererProps {
  content: string;
}

function useMarkdownRenderer({ content }: UseMarkdownRendererProps) {
  const codeRef = useRef<HTMLElement>(null);

  return { codeRef };
}

export default useMarkdownRenderer;
