import { FileCheckpoint, UseGeneratedPromptDisplayProps } from '@/types/general_types';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FiFileText, FiSettings } from 'react-icons/fi';
import { SiCss3, SiHtml5, SiJavascript, SiJson, SiMarkdown, SiPython, SiReact, SiTypescript } from 'react-icons/si';



// get file icon and badge style based on extension
export const getFileIconAndStyle = (fileName: string) => {
  const ext = fileName.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'js':
      return { icon: SiJavascript, badgeClass: 'badge-warning' };
    case 'ts':
    case 'tsx':
      return { icon: SiTypescript, badgeClass: 'badge-info' };
    case 'jsx':
      return { icon: SiReact, badgeClass: 'badge-accent' };
    case 'py':
      return { icon: SiPython, badgeClass: 'badge-success' };
    case 'md':
      return { icon: SiMarkdown, badgeClass: 'badge-neutral' };
    case 'json':
      return { icon: SiJson, badgeClass: 'badge-warning' };
    case 'css':
      return { icon: SiCss3, badgeClass: 'badge-info' };
    case 'html':
      return { icon: SiHtml5, badgeClass: 'badge-error' };
    case 'config':
    case 'conf':
    case 'env':
      return { icon: FiSettings, badgeClass: 'badge-secondary' };
    default:
      return { icon: FiFileText, badgeClass: 'badge-ghost' };
  }
};

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