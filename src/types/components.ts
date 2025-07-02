// UI component types

import { ButtonHTMLAttributes, ReactNode } from "react";

// Prompt generator types
export interface ApiKeyFormProps {
  apiKeyInput: string;
  setApiKeyInput: (val: string) => void;
  localSaveApiKey: (e: React.FormEvent) => void;
}

export interface GeneratedPromptDisplayProps {
  generatedPrompt: string;
  showGeneratedPrompt: boolean;
  isPromptMinimized: boolean;
  setShowGeneratedPrompt: (val: boolean) => void;
  setIsPromptMinimized: (val: boolean) => void;
}

export interface FileCheckpoint {
  fileName: string;
  position: number;
}

export interface UseGeneratedPromptDisplayProps {
  generatedPrompt: string;
  showGeneratedPrompt: boolean;
  isPromptMinimized: boolean;
}

// File context types
export interface FileContextType {
  fileText: string;
  setFileText: React.Dispatch<React.SetStateAction<string>>;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  removeFile: (index: number) => void;
  fileContents: Map<string, string>;
  setFileContents: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  generatePrompt: (userPrompt: string) => string;
}

// Common component types
// Exclude event handlers that conflict with Motion's animation and interaction system
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 
  | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onAnimationCancel'
  | 'onDragStart' | 'onDrag' | 'onDragEnd' | 'onDragEnter' | 'onDragExit' 
  | 'onDragLeave' | 'onDragOver' | 'onDrop'
>;

export interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  delay?: number;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'clickable';
}

export interface AnimatedLogoProps {
  isHovered: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
  className?: string
}

export interface SectionHeaderProps {
  title: string;
  description?: string;
}