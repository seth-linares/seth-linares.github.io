// src/utils/regex/regexParser.ts
import type { 
  CharacterClassResult, 
  EscapeResult, 
  GroupResult, 
  PatternToken, 
  QuantifierResult, 
  RegexFlags 
} from "@/types/regex";

/**
 * Parses a character class starting at the given position.
 * Handles edge cases like []], [^]], [\d\w], [-a], [a-].
 */
function parseCharacterClass(pattern: string, start: number): CharacterClassResult | null {
  if (pattern[start] !== "[") return null;
  
  let pos = start + 1;
  let negated = false;
  
  // Check for negation
  if (pos < pattern.length && pattern[pos] === "^") {
    negated = true;
    pos++;
  }
  
  // Handle special case where ] is first character (literal ])
  if (pos < pattern.length && pattern[pos] === "]") {
    pos++;
  }
  
  // Parse the character class content
  let escaped = false;
  while (pos < pattern.length) {
    const c = pattern[pos];
    
    if (escaped) {
      escaped = false;
      pos++;
      continue;
    }
    
    if (c === "\\") {
      escaped = true;
      pos++;
      continue;
    }
    
    if (c === "]") {
      break;
    }
    
    pos++;
  }
  
  // Check if we found the closing ]
  if (pos >= pattern.length || pattern[pos] !== "]") {
    return null; // Invalid character class
  }
  
  const value = pattern.slice(start, pos + 1);
  const inner = pattern.slice(start + (negated ? 2 : 1), pos);
  
  let description = negated 
    ? "Matches any character NOT in the set" 
    : "Matches any single character in the set";
    
  // Add more specific description based on content
  if (inner.includes("\\d") || inner.includes("\\w") || inner.includes("\\s")) {
    description += " (includes escape sequences)";
  } else if (inner.includes("-") && inner.length > 2) {
    description += " (includes ranges)";
  }
  
  return {
    value,
    end: pos + 1,
    description
  };
}

/**
 * Parses escape sequences including character escapes, hex, unicode, etc.
 */
function parseEscapeSequence(pattern: string, start: number): EscapeResult | null {
  if (pattern[start] !== "\\") return null;
  if (start + 1 >= pattern.length) return null;
  
  const next = pattern[start + 1];
  
  // Basic character class escapes
  const basicEscapes: Record<string, string> = {
    d: "Matches any digit (0-9)",
    D: "Matches any non-digit",
    w: "Matches any word character (a-z, A-Z, 0-9, _)",
    W: "Matches any non-word character",
    s: "Matches any whitespace character",
    S: "Matches any non-whitespace character",
    b: "Word boundary",
    B: "Non-word boundary",
    n: "Newline character",
    t: "Tab character",
    r: "Carriage return",
    f: "Form feed",
    v: "Vertical tab",
    "0": "Null character",
  };
  
  if (basicEscapes[next]) {
    return {
      value: pattern.slice(start, start + 2),
      end: start + 2,
      description: basicEscapes[next]
    };
  }
  
  // Escaped meta-characters
  const metaCharacters = "()[]{}.*+?|^$\\";
  if (metaCharacters.includes(next)) {
    return {
      value: pattern.slice(start, start + 2),
      end: start + 2,
      description: `Literal ${next} character (escaped)`
    };
  }
  
  // Hexadecimal escapes \xNN
  if (next === "x") {
    if (start + 3 < pattern.length) {
      const hex = pattern.slice(start + 2, start + 4);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        const charCode = parseInt(hex, 16);
        const charName = charCode < 32 ? "control character" : `character '${String.fromCharCode(charCode)}'`;
        return {
          value: pattern.slice(start, start + 4),
          end: start + 4,
          description: `Hexadecimal escape for ${charName} (\\x${hex.toUpperCase()})`
        };
      } else {
        // Invalid hex digits
        return {
          value: pattern.slice(start, start + 4),
          end: start + 4,
          description: "Invalid hexadecimal escape (treated as literal characters)"
        };
      }
    } else {
      // Incomplete hex escape
      const available = pattern.slice(start + 2);
      return {
        value: pattern.slice(start, start + 2 + available.length),
        end: start + 2 + available.length,
        description: "Incomplete hexadecimal escape (\\x requires 2 hex digits)"
      };
    }
  }
  
  // Unicode escapes \uNNNN
  if (next === "u") {
    if (start + 2 < pattern.length && pattern[start + 2] === "{") {
      // Extended Unicode escapes \u{NNNNNN} - handled later
    } else if (start + 5 < pattern.length) {
      const unicode = pattern.slice(start + 2, start + 6);
      if (/^[0-9A-Fa-f]{4}$/.test(unicode)) {
        const charCode = parseInt(unicode, 16);
        const charName = String.fromCharCode(charCode);
        return {
          value: pattern.slice(start, start + 6),
          end: start + 6,
          description: `Unicode escape for '${charName}' (\\u${unicode.toUpperCase()})`
        };
      } else {
        // Invalid unicode digits
        return {
          value: pattern.slice(start, start + 6),
          end: start + 6,
          description: "Invalid Unicode escape (treated as literal characters)"
        };
      }
    } else {
      // Incomplete unicode escape
      const available = pattern.slice(start + 2);
      return {
        value: pattern.slice(start, start + 2 + available.length),
        end: start + 2 + available.length,
        description: "Incomplete Unicode escape (\\u requires 4 hex digits)"
      };
    }
  }
  
  // Extended Unicode escapes \u{NNNNNN}
  if (next === "u" && start + 2 < pattern.length && pattern[start + 2] === "{") {
    let pos = start + 3;
    while (pos < pattern.length && pattern[pos] !== "}") {
      if (!/[0-9A-Fa-f]/.test(pattern[pos])) break;
      pos++;
    }
    if (pos < pattern.length && pattern[pos] === "}") {
      const unicode = pattern.slice(start + 3, pos);
      if (unicode.length > 0 && unicode.length <= 6) {
        const charCode = parseInt(unicode, 16);
        try {
          const charName = String.fromCodePoint(charCode);
          return {
            value: pattern.slice(start, pos + 1),
            end: pos + 1,
            description: `Extended Unicode escape for '${charName}' (\\u{${unicode.toUpperCase()}})`
          };
        } catch {
          return {
            value: pattern.slice(start, pos + 1),
            end: pos + 1,
            description: `Extended Unicode escape (\\u{${unicode.toUpperCase()}})`
          };
        }
      }
    }
  }
  
  // Control characters \cX
  if (next === "c" && start + 2 < pattern.length) {
    const controlChar = pattern[start + 2];
    if (/[A-Za-z]/.test(controlChar)) {
      return {
        value: pattern.slice(start, start + 3),
        end: start + 3,
        description: `Control character Ctrl+${controlChar.toUpperCase()}`
      };
    }
  }
  
  // Named backreferences \k<name>
  if (next === "k" && start + 2 < pattern.length && pattern[start + 2] === "<") {
    let pos = start + 3;
    while (pos < pattern.length && pattern[pos] !== ">") {
      pos++;
    }
    if (pos < pattern.length && pattern[pos] === ">") {
      const groupName = pattern.slice(start + 3, pos);
      return {
        value: pattern.slice(start, pos + 1),
        end: pos + 1,
        description: `Named backreference to group "${groupName}"`
      };
    }
  }
  
  // Numbered backreferences \1, \2, etc.
  if (/[1-9]/.test(next)) {
    let pos = start + 1;
    while (pos < pattern.length && /[0-9]/.test(pattern[pos])) {
      pos++;
    }
    return {
      value: pattern.slice(start, pos),
      end: pos,
      description: `Backreference to capture group ${pattern.slice(start + 1, pos)}`
    };
  }
  
  // Default: treat as literal escaped character
  return {
    value: pattern.slice(start, start + 2),
    end: start + 2,
    description: `Literal '${next}' character (escaped)`
  };
}

// Maximum nesting depth to prevent stack overflow
const MAX_NESTING_DEPTH = 50;

/**
 * Parses various group types including lookarounds, named groups, etc.
 */
function parseGroup(pattern: string, start: number, flags: RegexFlags, depth: number = 0): GroupResult | null {
  // Prevent excessive nesting that could cause stack overflow
  if (depth > MAX_NESTING_DEPTH) {
    throw new Error(`Pattern too deeply nested (max depth: ${MAX_NESTING_DEPTH})`);
  }
  if (pattern[start] !== "(") return null;
  
  let pos = start + 1;
  let groupType = "capturing";
  let groupName: string | undefined;
  let description = "Capturing group";
  
  // Check for special group types starting with ?
  if (pos < pattern.length && pattern[pos] === "?") {
    pos++;
    if (pos < pattern.length) {
      const specifier = pattern[pos];
      
      switch (specifier) {
        case ":":
          pos++;
          groupType = "non-capturing";
          description = "Non-capturing group";
          break;
          
        case "=":
          pos++;
          groupType = "positive-lookahead";
          description = "Positive lookahead - matches if followed by this pattern";
          break;
          
        case "!":
          pos++;
          groupType = "negative-lookahead";
          description = "Negative lookahead - matches if NOT followed by this pattern";
          break;
          
        case "<":
          pos++;
          if (pos < pattern.length) {
            if (pattern[pos] === "=") {
              pos++;
              groupType = "positive-lookbehind";
              description = "Positive lookbehind - matches if preceded by this pattern";
            } else if (pattern[pos] === "!") {
              pos++;
              groupType = "negative-lookbehind";
              description = "Negative lookbehind - matches if NOT preceded by this pattern";
            } else {
              // Named capture group (?<name>...)
              const nameStart = pos;
              while (pos < pattern.length && pattern[pos] !== ">") {
                pos++;
              }
              if (pos < pattern.length && pattern[pos] === ">") {
                groupName = pattern.slice(nameStart, pos);
                pos++;
                groupType = "named-capturing";
                description = `Named capturing group "${groupName}"`;
              }
            }
          }
          break;
          
        default:
          // Handle inline modifiers like (?i:...) if needed
          groupType = "non-capturing";
          description = "Non-capturing group with modifiers";
          break;
      }
    }
  }
  
  // Find the matching closing parenthesis
  let parenDepth = 1;
  let escaped = false;
  
  while (pos < pattern.length && parenDepth > 0) {
    const c = pattern[pos];
    
    if (escaped) {
      escaped = false;
      pos++;
      continue;
    }
    
    if (c === "\\") {
      escaped = true;
      pos++;
      continue;
    }
    
    if (c === "(") parenDepth++;
    if (c === ")") parenDepth--;
    pos++;
  }
  
  if (parenDepth > 0) {
    return null; // Unclosed group
  }
  
  const value = pattern.slice(start, pos);
  const innerStart = groupType === "capturing" ? start + 1 : 
                    groupName ? start + groupName.length + 4 : // (?<name>
                    start + 3; // (?:, (?=, etc.
  const inner = pattern.slice(innerStart, pos - 1);
  
  return {
    value,
    end: pos,
    description,
    groupType,
    groupName,
    children: inner ? parseRegexPatternInternal(inner, flags, depth + 1) : []
  };
}

/**
 * Parses {m,n} style quantifiers with lazy support
 */
function parseQuantifier(pattern: string, start: number): QuantifierResult | null {
  if (pattern[start] !== "{") return null;
  
  let pos = start + 1;
  let content = "";
  
  // Extract the quantifier content
  while (pos < pattern.length && pattern[pos] !== "}") {
    content += pattern[pos];
    pos++;
  }
  
  if (pos >= pattern.length || pattern[pos] !== "}") {
    return null; // Invalid quantifier
  }
  
  pos++; // Move past }
  
  // Check for lazy modifier
  let lazy = false;
  if (pos < pattern.length && pattern[pos] === "?") {
    lazy = true;
    pos++;
  }
  
  // Parse the quantifier content
  let description = "Quantifier";
  
  if (!content) {
    description = "Empty quantifier (invalid)";
  } else {
    const parts = content.split(",");
    
    if (parts.length === 1) {
      // {n} - exactly n times
      const num = parts[0].trim();
      if (/^\d+$/.test(num)) {
        const count = parseInt(num);
        if (count > 10000) {
          description = `Matches exactly ${num} times (very large, may cause performance issues)`;
        } else {
          description = `Matches exactly ${num} times`;
        }
      } else {
        description = `Invalid quantifier value "${num}" (non-numeric)`;
      }
    } else if (parts.length === 2) {
      const min = parts[0].trim();
      const max = parts[1].trim();
      
      if (min === "" && max !== "") {
        // {,n} - up to n times (non-standard)
        if (/^\d+$/.test(max)) {
          description = `Matches up to ${max} times`;
        } else {
          description = `Invalid quantifier max value "${max}"`;
        }
      } else if (min !== "" && max === "") {
        // {n,} - n or more times
        if (/^\d+$/.test(min)) {
          description = `Matches ${min} or more times`;
        } else {
          description = `Invalid quantifier min value "${min}"`;
        }
      } else if (min !== "" && max !== "") {
        // {n,m} - between n and m times
        if (/^\d+$/.test(min) && /^\d+$/.test(max)) {
          const minNum = parseInt(min);
          const maxNum = parseInt(max);
          if (minNum > maxNum) {
            description = `Invalid quantifier: min (${min}) > max (${max})`;
          } else if (min === max) {
            description = `Matches exactly ${min} times`;
          } else {
            description = `Matches between ${min} and ${max} times`;
          }
        } else {
          description = `Invalid quantifier values "${min}, ${max}"`;
        }
      } else {
        description = "Empty quantifier range (invalid)";
      }
    } else {
      description = `Invalid quantifier format "${content}"`;
    }
  }
  
  if (lazy) {
    description += " (lazy/non-greedy)";
  } else {
    description += " (greedy)";
  }
  
  return {
    value: pattern.slice(start, pos),
    end: pos,
    description
  };
}

/**
 * Detects potentially dangerous regex patterns that could cause ReDoS (Regular Expression Denial of Service)
 */
function detectPotentialReDoS(pattern: string): string[] {
  const warnings: string[] = [];
  
  // Nested quantifiers: (a+)+, (a*)+, (a?)*, etc.
  const nestedQuantifierPatterns = [
    /\([^)]*[*+][^)]*\)[*+?]/,  // (a+)+ or (a+)? 
    /\([^)]*[*+?][^)]*\)[*+]/,  // (a+)* or (a?)+ 
    /\([^)]*\?[^)]*\)[*+]/,     // (a?)+
  ];
  
  for (const regexPattern of nestedQuantifierPatterns) {
    if (regexPattern.test(pattern)) {
      warnings.push("Potential catastrophic backtracking: nested quantifiers can cause exponential time complexity");
      break;
    }
  }
  
  // Alternation with quantifiers: (a|a)+, (ab|a)*, etc.
  if (/\([^)]*\|[^)]*\)[*+?]/.test(pattern)) {
    warnings.push("Potential performance issue: quantified alternation with overlapping branches");
  }
  
  // Multiple consecutive quantifiers (invalid but dangerous): a++, b**
  if (/[*+?][*+?]/.test(pattern)) {
    warnings.push("Invalid pattern: consecutive quantifiers");
  }
  
  // Very large quantifiers: {999999}
  const largeQuantifier = pattern.match(/\{(\d+)(?:,(\d+))?\}/g);
  if (largeQuantifier) {
    for (const quant of largeQuantifier) {
      const numbers = quant.match(/\d+/g);
      if (numbers && numbers.some(n => parseInt(n) > 10000)) {
        warnings.push("Very large quantifier values may cause performance issues");
        break;
      }
    }
  }
  
  // Deep nesting check (basic)
  let maxDepth = 0;
  let currentDepth = 0;
  for (const char of pattern) {
    if (char === '(') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === ')') {
      currentDepth--;
    }
  }
  
  if (maxDepth > 10) {
    warnings.push("Deeply nested pattern may impact performance");
  }
  
  return warnings;
}

/**
 * Validates pattern for common issues and returns warnings
 */
function validatePattern(tokens: PatternToken[]): string[] {
  const warnings: string[] = [];
  
  // Count capturing groups and validate backreferences
  let capturingGroupCount = 0;
  const namedGroups = new Set<string>();
  
  function countGroups(tokens: PatternToken[]): void {
    tokens.forEach(token => {
      if (token.type === 'group') {
        // Only count capturing groups (not lookarounds)
        if (!token.description?.includes('lookahead') && !token.description?.includes('lookbehind')) {
          if (token.description?.includes('Named capturing')) {
            // Extract group name from description
            const nameMatch = token.description.match(/"([^"]+)"/);
            if (nameMatch) {
              const groupName = nameMatch[1];
              if (namedGroups.has(groupName)) {
                warnings.push(`Duplicate named group "${groupName}"`);
              } else {
                namedGroups.add(groupName);
              }
            }
          } else if (token.description === 'Capturing group') {
            capturingGroupCount++;
          }
        }
        
        // Recursively count groups in children
        if (token.children) {
          countGroups(token.children);
        }
      }
    });
  }
  
  function validateBackreferences(tokens: PatternToken[]): void {
    tokens.forEach(token => {
      if (token.type === 'escape') {
        // Check numbered backreferences
        const numberedMatch = token.value.match(/^\\(\d+)$/);
        if (numberedMatch) {
          const refNum = parseInt(numberedMatch[1]);
          if (refNum > capturingGroupCount) {
            warnings.push(`Backreference \\${refNum} refers to non-existent group (only ${capturingGroupCount} capturing groups found)`);
          }
        }
        
        // Check named backreferences
        const namedMatch = token.value.match(/^\\k<([^>]+)>$/);
        if (namedMatch) {
          const refName = namedMatch[1];
          if (!namedGroups.has(refName)) {
            warnings.push(`Named backreference \\k<${refName}> refers to non-existent group`);
          }
        }
      }
      
      // Recursively validate in children
      if (token.children) {
        validateBackreferences(token.children);
      }
    });
  }
  
  // First pass: count groups
  countGroups(tokens);
  
  // Second pass: validate backreferences
  validateBackreferences(tokens);
  
  // Check for other pattern issues
  function checkPatternIssues(tokens: PatternToken[]): void {
    tokens.forEach((token, index) => {
      // Check for quantifiers on anchors (usually invalid)
      if (token.type === 'anchor' && index + 1 < tokens.length) {
        const nextToken = tokens[index + 1];
        if (nextToken.type === 'quantifier') {
          warnings.push(`Quantifier ${nextToken.value} after anchor ${token.value} is invalid`);
        }
      }
      
      // Check for quantifiers on lookarounds (usually invalid)
      if (token.type === 'group' && token.description?.includes('look') && index + 1 < tokens.length) {
        const nextToken = tokens[index + 1];
        if (nextToken.type === 'quantifier') {
          warnings.push(`Quantifier ${nextToken.value} after ${token.description?.toLowerCase()} is invalid`);
        }
      }
      
      // Recursively check children
      if (token.children) {
        checkPatternIssues(token.children);
      }
    });
  }
  
  checkPatternIssues(tokens);
  
  return warnings;
}

/**
 * Enhances token descriptions based on context for better user understanding
 */
function enhanceDescriptions(tokens: PatternToken[], flags?: RegexFlags): PatternToken[] {
  const enhanced = tokens.map((token, index) => {
    let enhancedDescription = token.description;
    
    // Enhance group descriptions when followed by quantifiers
    if (token.type === 'group' && index + 1 < tokens.length) {
      const nextToken = tokens[index + 1];
      if (nextToken.type === 'quantifier') {
        const quantifierDesc = nextToken.description?.toLowerCase() || '';
        if (quantifierDesc.includes('1 or more')) {
          enhancedDescription += ' (repeated one or more times)';
        } else if (quantifierDesc.includes('0 or more')) {
          enhancedDescription += ' (repeated zero or more times)';
        } else if (quantifierDesc.includes('0 or 1')) {
          enhancedDescription += ' (optional)';
        } else {
          enhancedDescription += ` (repeated ${quantifierDesc.replace(/matches?\s*/i, '').replace(/\s*\(.*?\)/, '')})`;
        }
      }
    }
    
    // Enhance word boundary descriptions based on context
    if (token.type === 'escape' && (token.value === '\\b' || token.value === '\\B')) {
      const prevToken = index > 0 ? tokens[index - 1] : null;
      const nextToken = index + 1 < tokens.length ? tokens[index + 1] : null;
      
      if (token.value === '\\b') {
        if (prevToken?.type === 'anchor' && prevToken.value === '^') {
          enhancedDescription = 'Word boundary (start of string/word)';
        } else if (nextToken?.type === 'anchor' && nextToken.value === '$') {
          enhancedDescription = 'Word boundary (end of word/string)';
        } else if (nextToken?.type === 'escape' && /\\[wdA-Z]/.test(nextToken.value)) {
          enhancedDescription = 'Word boundary (start of word)';
        } else if (prevToken?.type === 'escape' && /\\[wdA-Z]/.test(prevToken.value)) {
          enhancedDescription = 'Word boundary (end of word)';
        }
      }
    }
    
    // Enhance escape sequences in specific contexts
    if (token.type === 'escape' && token.value === '\\d') {
      if (index + 1 < tokens.length && tokens[index + 1].type === 'quantifier') {
        const quantifier = tokens[index + 1];
        if (quantifier.value === '+') {
          enhancedDescription = 'Matches one or more digits (number matching)';
        } else if (quantifier.value === '{4}') {
          enhancedDescription = 'Matches exactly 4 digits (likely year)';
        } else if (quantifier.value === '{2}') {
          enhancedDescription = 'Matches exactly 2 digits (likely day/month)';
        }
      }
    }
    
    // Enhance character class descriptions based on content and flags
    if (token.type === 'character-class') {
      if (token.value.includes('0-9') && token.value.includes('a-z') && token.value.includes('A-Z')) {
        enhancedDescription = 'Matches alphanumeric characters (letters and digits)';
      } else if (token.value.includes('0-9') && (token.value.includes('a-f') || token.value.includes('A-F'))) {
        enhancedDescription = 'Matches hexadecimal digits (0-9, A-F)';
      } else if (token.value.includes('a-z') && flags?.i) {
        enhancedDescription += ' (case-insensitive due to i flag)';
      } else if (token.value.includes('A-Z') && flags?.i) {
        enhancedDescription += ' (case-insensitive due to i flag)';
      }
    }
    
    // Enhance dot descriptions based on context and flags
    if (token.type === 'wildcard' && token.value === '.') {
      if (index > 0 && tokens[index - 1].type === 'escape' && tokens[index - 1].value === '\\') {
        // This shouldn't happen with proper parsing, but just in case
        enhancedDescription = 'Literal dot character (escaped)';
      } else if (index + 1 < tokens.length && tokens[index + 1].type === 'quantifier') {
        const quantifier = tokens[index + 1];
        if (quantifier.value === '*' || quantifier.value === '+') {
          if (flags?.s) {
            enhancedDescription += ' (matches any sequence of characters including newlines)';
          } else {
            enhancedDescription += ' (matches any sequence of characters except newlines)';
          }
        }
      }
    }
    
    // Add flag-specific enhancements
    if (flags) {
      if (token.type === 'literal' && /[a-zA-Z]/.test(token.value) && flags.i) {
        enhancedDescription += ' (case-insensitive)';
      }
      
      if (token.type === 'anchor' && flags.y) {
        if (token.value === '^') {
          enhancedDescription = 'Start of string (sticky mode - matches at lastIndex)';
        } else if (token.value === '$') {
          enhancedDescription = 'End of string (sticky mode)';
        }
      }
      
      if (token.type === 'escape' && token.value.startsWith('\\u') && flags.u) {
        enhancedDescription += ' (Unicode mode enabled)';
      }
    }
    
    // Recursively enhance children
    const enhancedChildren = token.children ? enhanceDescriptions(token.children, flags) : token.children;
    
    return {
      ...token,
      description: enhancedDescription,
      children: enhancedChildren
    };
  });
  
  return enhanced;
}

/**
 * Internal parser with depth tracking for recursion safety
 */
function parseRegexPatternInternal(pattern: string, flags?: Partial<RegexFlags>, depth: number = 0): PatternToken[] {
  const resolvedFlags: RegexFlags = {
    g: false,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
    ...flags
  };
  const tokens: PatternToken[] = [];
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];
    const start = i;

    try {

    // Character class [...]
    if (char === "[") {
      const result = parseCharacterClass(pattern, i);
      if (result) {
        tokens.push({
          type: "character-class",
          value: result.value,
          start,
          end: result.end,
          description: result.description,
        });
        i = result.end;
        continue;
      }
    }

    // Escape sequences like \d, \w, \s, \n, \t, etc.
    if (char === "\\" && i + 1 < pattern.length) {
      const escapeResult = parseEscapeSequence(pattern, i);
      if (escapeResult) {
        tokens.push({
          type: "escape",
          value: escapeResult.value,
          start,
          end: escapeResult.end,
          description: escapeResult.description,
        });
        i = escapeResult.end;
        continue;
      }
    }

    // Quantifiers *, +, ?, and {m,n} with lazy support
    if (char === "*" || char === "+" || char === "?") {
      let quantifierEnd = i + 1;
      let lazy = false;
      
      // Check for lazy modifier
      if (quantifierEnd < pattern.length && pattern[quantifierEnd] === "?") {
        lazy = true;
        quantifierEnd++;
      }
      
      const quantifierValue = pattern.slice(i, quantifierEnd);
      const baseDescription = char === "*"
        ? "0 or more times"
        : char === "+"
        ? "1 or more times" 
        : "0 or 1 time";
      
      const description = lazy
        ? `Matches ${baseDescription} (lazy/non-greedy)`
        : `Matches ${baseDescription} (greedy)`;
      
      tokens.push({
        type: "quantifier",
        value: quantifierValue,
        start,
        end: quantifierEnd,
        description,
      });
      i = quantifierEnd;
      continue;
    }
    if (char === "{") {
      const quantifierResult = parseQuantifier(pattern, i);
      if (quantifierResult) {
        tokens.push({
          type: "quantifier",
          value: quantifierResult.value,
          start,
          end: quantifierResult.end,
          description: quantifierResult.description,
        });
        i = quantifierResult.end;
        continue;
      }
    }

    // Anchors ^ and $
    if (char === "^" || char === "$") {
      const anchorDescription = char === "^"
        ? resolvedFlags.m ? "Start of line (multiline mode)" : "Start of string"
        : resolvedFlags.m ? "End of line (multiline mode)" : "End of string";
      tokens.push({
        type: "anchor",
        value: char,
        start,
        end: i + 1,
        description: anchorDescription,
      });
      i++;
      continue;
    }

    // Groups (...) - supports all group types
    if (char === "(") {
      const groupResult = parseGroup(pattern, i, resolvedFlags, depth);
      if (groupResult) {
        tokens.push({
          type: "group",
          value: groupResult.value,
          start,
          end: groupResult.end,
          description: groupResult.description,
          children: groupResult.children,
        });
        i = groupResult.end;
        continue;
      }
    }

    // Alternation |
    if (char === "|") {
      tokens.push({
        type: "alternation",
        value: "|",
        start,
        end: i + 1,
        description: "Alternation (OR)",
      });
      i++;
      continue;
    }

    // Dot .
    if (char === ".") {
      const dotDescription = resolvedFlags.s 
        ? "Matches any character including line terminators (dotAll flag enabled)"
        : "Matches any character except line terminators";
      tokens.push({
        type: "wildcard",
        value: ".",
        start,
        end: i + 1,
        description: dotDescription,
      });
      i++;
      continue;
    }

      // Literal character
      tokens.push({
        type: "literal",
        value: char,
        start,
        end: i + 1,
        description: `Matches the character "${char}"`,
      });
      i++;
    } catch {
      // Error recovery: treat as unknown/literal token
      tokens.push({
        type: "unknown",
        value: char,
        start,
        end: i + 1,
        description: `Unknown or malformed pattern element "${char}"`,
      });
      i++;
    }
  }

  return tokens;
}

/**
 * Very lightweight regex pattern parser for visual explanation.
 * This is not a full RFC parser; it covers common constructs used in the playground.
 */
export function parseRegexPattern(pattern: string, flags?: Partial<RegexFlags>): PatternToken[] {
  const resolvedFlags: RegexFlags = {
    g: false,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
    ...flags
  };
  const tokens = parseRegexPatternInternal(pattern, flags, 0);
  return enhanceDescriptions(tokens, resolvedFlags);
}

/**
 * Enhanced parser that returns both tokens and analysis warnings
 */
export function parseRegexPatternWithWarnings(pattern: string, flags?: Partial<RegexFlags>): {
  tokens: PatternToken[];
  warnings: string[];
} {
  const tokens = parseRegexPattern(pattern, flags);
  const redosWarnings = detectPotentialReDoS(pattern);
  const validationWarnings = validatePattern(tokens);
  
  return {
    tokens,
    warnings: [...redosWarnings, ...validationWarnings]
  };
}

/**
 * Basic parser without context enhancements (for performance-critical cases)
 */
export function parseRegexPatternBasic(pattern: string, flags?: Partial<RegexFlags>): PatternToken[] {
  return parseRegexPatternInternal(pattern, flags, 0);
}
