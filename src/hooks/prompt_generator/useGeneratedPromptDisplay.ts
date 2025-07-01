import { useState, useRef, useEffect, useCallback } from 'react';

interface FileCheckpoint {
  fileName: string;
  position: number;
}

interface UseGeneratedPromptDisplayProps {
  generatedPrompt: string;
  showGeneratedPrompt: boolean;
  isPromptMinimized: boolean;
}

export const useGeneratedPromptDisplay = ({
  generatedPrompt,
  showGeneratedPrompt,
  isPromptMinimized
}: UseGeneratedPromptDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [showFileNav, setShowFileNav] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [fileCheckpoints, setFileCheckpoints] = useState<FileCheckpoint[]>([]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [generatedPrompt]);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ 
        top: scrollContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, []);

  const updateScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1);
    }
  }, []);

  // Generate file checkpoints by finding file headers in the DOM
  const generateFileCheckpoints = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const headings = container.querySelectorAll('h2');
    const checkpoints: FileCheckpoint[] = [];
    
    headings.forEach((heading) => {
      const code = heading.querySelector('code');
      if (code) {
        const fileName = code.textContent || '';
        const rect = heading.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const position = rect.top - containerRect.top + container.scrollTop;
        
        checkpoints.push({ fileName, position });
      }
    });
    
    setFileCheckpoints(checkpoints);
  }, []);
  
  const scrollToFile = useCallback((fileName: string) => {
    const checkpoint = fileCheckpoints.find(cp => cp.fileName === fileName);
    if (checkpoint && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: checkpoint.position - 20, // Small offset for better visibility
        behavior: 'smooth'
      });
      setShowFileNav(false);
    }
  }, [fileCheckpoints]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons(); // Initial check
      
      // Generate checkpoints after content loads
      const timer = setTimeout(generateFileCheckpoints, 500);
      
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        clearTimeout(timer);
      };
    }
  }, [showGeneratedPrompt, isPromptMinimized, generatedPrompt, updateScrollButtons, generateFileCheckpoints]);

  return {
    copied,
    showFileNav,
    setShowFileNav,
    scrollContainerRef,
    canScrollUp,
    canScrollDown,
    fileCheckpoints,
    handleCopy,
    scrollToTop,
    scrollToBottom,
    scrollToFile
  };
};