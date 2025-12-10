// src/types/regex.ts

export type RegexFlavor = 'javascript' | 'python' | 'java' | 'pcre';

// Props interfaces
export interface CodeSectionProps{
  title: string;
  code: string;
  onCopy: () => void;
  pattern: string;
  flags: RegexFlags;
};

export interface MatchesNavProps {
  totalMatches: number;
  currentIndex: number; // 1-based index for display
  disabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  error?: string | null;
};

export interface MatchVisualizerProps {
  testStrings: string[];
  matches: VisualMatch[];
  error: string | null;
  // Optional: emphasize an active global match and allow auto-scroll behavior
  activeGlobalIndex?: number;
  onScrollToActive?: boolean;
};

export interface PatternInputProps {
  pattern: string;
  setPattern: (v: string) => void;
  flags: RegexFlags;
  toggleFlag: (k: keyof RegexFlags) => void;
};

export interface FlagToggleProps { 
  k: keyof RegexFlags; 
  active: boolean; 
  onToggle: () => void;
};

export interface PatternLibraryProps {
  onUsePattern: (p: LibraryUsePayload) => void;
  activePatternId?: string;
};

export interface TestStringInputProps {
  testStrings: string[];
  setTestStringAt: (i: number, v: string) => void;
  addTestString: () => void;
  removeTestString: (i: number) => void;
};



// Other interfaces/types
export interface VisualMatch {
  testStringIndex: number;
  // Use SingleMatch so components can access groups and indices
  matches: SingleMatch[];
  totalMatches: number;
  truncated: boolean;
};

export interface LibraryUsePayload {
  pattern: string;
  flags?: Partial<RegexFlags>;
  testString?: string;
};


export interface MatchGroup {
  name?: string;
  value: string;
  start: number;
  end: number;
}

export interface SingleMatch {
  fullMatch: string;
  start: number;
  end: number;
  groups: MatchGroup[];
}

export interface MatchResult {
  testStringIndex: number;
  matches: SingleMatch[];
  totalMatches: number;
  truncated: boolean; // indicates we hit max matches cap
}



export interface PatternExplanation {
  ast: PatternToken[];
  summary: string;
  warnings?: string[];
}

export interface RegexPlaygroundState {
  pattern: string;
  testStrings: string[];
  flags: RegexFlags;
  flavor: RegexFlavor;
  matches: MatchResult[];
  explanation: PatternExplanation | null;
  error: string | null;
  activePatternId: string | null;
}

export interface LibraryPattern {
  id: string;
  name: string;
  pattern: string;
  flags?: Partial<RegexFlags>;
  description?: string;
  category: 'validation' | 'extraction' | 'formatting' | 'misc';
  /** Example strings that match this pattern */
  examples?: {
    matches: string[];
    doesNotMatch?: string[];
  };
  /** Default test string to populate when pattern is selected */
  testString?: string;
}

export interface CodeGenOptions {
  pattern: string;
  flags: RegexFlags;
  testVarName?: string;
}

export const defaultFlags: RegexFlags = {
  g: true,
  i: false,
  m: false,
  s: false,
  u: false,
  y: false,
};

/**
 * Converts RegexFlags object to a string representation (e.g., "gi")
 */
export function flagsToString(flags: RegexFlags): string {
  return [
    flags.g ? 'g' : '',
    flags.i ? 'i' : '',
    flags.m ? 'm' : '',
    flags.s ? 's' : '',
    flags.u ? 'u' : '',
    flags.y ? 'y' : '',
  ].join('');
}

// regexParser types

export interface PatternToken {
  type: string;
  value: string;
  start: number;
  end: number;
  description?: string;
  children?: PatternToken[];
}

export interface RegexFlags {
  g: boolean; // global
  i: boolean; // ignore case
  m: boolean; // multiline
  s: boolean; // dotAll
  u: boolean; // unicode
  y: boolean; // sticky
}

export interface CharacterClassResult {
  value: string;
  end: number;
  description: string;
}

export interface EscapeResult {
  value: string;
  end: number;
  description: string;
}

export interface GroupResult {
  value: string;
  end: number;
  description: string;
  groupType: string;
  groupName?: string;
  children: PatternToken[];
}

export interface QuantifierResult {
  value: string;
  end: number;
  description: string;
}