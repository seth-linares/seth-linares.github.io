// src/utils/regex/beginnerDescriptions.ts
import type { PatternToken } from "@/types/regex";

/**
 * Maps technical regex descriptions to beginner-friendly explanations
 * with concrete examples that help users understand what the pattern does.
 */

interface BeginnerDescription {
  simple: string;
  example?: string;
}

// Escape sequence mappings (value -> description)
const ESCAPE_DESCRIPTIONS: Record<string, BeginnerDescription> = {
  "\\d": {
    simple: "Any single digit (0-9)",
    example: "In '2024', matches '2', '0', '2', '4' separately",
  },
  "\\D": {
    simple: "Any character that's NOT a digit",
    example: "In 'a1b2', matches 'a' and 'b'",
  },
  "\\w": {
    simple: "Any letter, digit, or underscore",
    example: "In 'hello_123', matches each character",
  },
  "\\W": {
    simple: "Any character that's NOT a letter, digit, or underscore",
    example: "In 'hi there!', matches the space and '!'",
  },
  "\\s": {
    simple: "Any whitespace (space, tab, newline)",
    example: "In 'hello world', matches the space",
  },
  "\\S": {
    simple: "Any character that's NOT whitespace",
    example: "In 'a b', matches 'a' and 'b'",
  },
  "\\b": {
    simple: "Word boundary (edge between word and non-word)",
    example: "\\bcat\\b matches 'cat' but not 'category'",
  },
  "\\B": {
    simple: "NOT a word boundary (inside a word)",
    example: "\\Bcat matches 'cat' in 'scatter' but not at start",
  },
  "\\n": {
    simple: "Newline character (line break)",
    example: "Matches where you press Enter",
  },
  "\\t": {
    simple: "Tab character",
    example: "Matches the Tab key character",
  },
  "\\r": {
    simple: "Carriage return (part of Windows line endings)",
    example: "Often paired with \\n as \\r\\n",
  },
};

// Quantifier patterns (for matching against description)
const QUANTIFIER_DESCRIPTIONS: Record<string, BeginnerDescription> = {
  "+": {
    simple: "One or more of the previous",
    example: "\\d+ matches '123' as one chunk, not separate digits",
  },
  "*": {
    simple: "Zero or more of the previous (optional, can repeat)",
    example: "\\d* matches '' (empty), '1', or '123'",
  },
  "?": {
    simple: "Optional - zero or one of the previous",
    example: "colou?r matches 'color' and 'colour'",
  },
};

// Anchor descriptions
const ANCHOR_DESCRIPTIONS: Record<string, BeginnerDescription> = {
  "^": {
    simple: "Must be at the very beginning",
    example: "^hello only matches if 'hello' starts the text",
  },
  "$": {
    simple: "Must be at the very end",
    example: "end$ only matches if 'end' is at the end of text",
  },
};

// Special character descriptions
const SPECIAL_DESCRIPTIONS: Record<string, BeginnerDescription> = {
  ".": {
    simple: "Any single character (except newline)",
    example: "a.c matches 'abc', 'a1c', 'a c', etc.",
  },
  "|": {
    simple: "OR - matches either side",
    example: "cat|dog matches 'cat' or 'dog'",
  },
};

/**
 * Get a beginner-friendly description for a pattern token
 */
export function getBeginnerDescription(token: PatternToken): BeginnerDescription {
  const { type, value, description } = token;

  // Handle escape sequences
  if (type === "escape") {
    // Check for known escape sequences
    if (ESCAPE_DESCRIPTIONS[value]) {
      return ESCAPE_DESCRIPTIONS[value];
    }

    // Handle escaped special characters like \. \* \+ etc.
    if (value.length === 2 && value.startsWith("\\")) {
      const escaped = value[1];
      return {
        simple: `Literal '${escaped}' character`,
        example: `Matches the actual ${escaped} symbol, not its special meaning`,
      };
    }

    // Handle backreferences
    if (/^\\[1-9]\d*$/.test(value)) {
      const groupNum = value.slice(1);
      return {
        simple: `Same text as capture group #${groupNum}`,
        example: `(\\w+) \\1 matches 'the the' (repeated word)`,
      };
    }

    // Handle named backreferences
    if (/^\\k<.+>$/.test(value)) {
      const groupName = value.slice(3, -1);
      return {
        simple: `Same text as the '${groupName}' group`,
        example: `Refers back to what (?<${groupName}>...) matched`,
      };
    }

    // Fallback for other escapes
    return {
      simple: description || `Escape sequence ${value}`,
    };
  }

  // Handle quantifiers
  if (type === "quantifier") {
    // Check for simple quantifiers
    if (QUANTIFIER_DESCRIPTIONS[value]) {
      return QUANTIFIER_DESCRIPTIONS[value];
    }

    // Handle + with lazy modifier
    if (value === "+?") {
      return {
        simple: "One or more (as few as possible)",
        example: "Stops at the first valid match, not the longest",
      };
    }

    // Handle * with lazy modifier
    if (value === "*?") {
      return {
        simple: "Zero or more (as few as possible)",
        example: "Matches the shortest possible string",
      };
    }

    // Handle ?? (lazy optional)
    if (value === "??") {
      return {
        simple: "Optional (prefers zero)",
        example: "Tries to skip if possible",
      };
    }

    // Handle {n} exact quantifier
    const exactMatch = value.match(/^\{(\d+)\}\??$/);
    if (exactMatch) {
      const count = exactMatch[1];
      return {
        simple: `Exactly ${count} of the previous`,
        example: `\\d{3} matches '123' but not '12' or '1234'`,
      };
    }

    // Handle {n,} at least n
    const atLeastMatch = value.match(/^\{(\d+),\}\??$/);
    if (atLeastMatch) {
      const min = atLeastMatch[1];
      return {
        simple: `${min} or more of the previous`,
        example: `\\d{2,} matches '12', '123', '1234', etc.`,
      };
    }

    // Handle {n,m} range
    const rangeMatch = value.match(/^\{(\d+),(\d+)\}\??$/);
    if (rangeMatch) {
      const min = rangeMatch[1];
      const max = rangeMatch[2];
      return {
        simple: `Between ${min} and ${max} of the previous`,
        example: `\\d{2,4} matches '12', '123', or '1234'`,
      };
    }

    // Check if lazy
    const isLazy = value.endsWith("?");
    const lazyNote = isLazy ? " (stops at shortest match)" : "";

    return {
      simple: (description || `Quantifier ${value}`) + lazyNote,
    };
  }

  // Handle anchors
  if (type === "anchor") {
    if (ANCHOR_DESCRIPTIONS[value]) {
      return ANCHOR_DESCRIPTIONS[value];
    }
    return {
      simple: description || `Position marker ${value}`,
    };
  }

  // Handle wildcard (.)
  if (type === "wildcard") {
    return SPECIAL_DESCRIPTIONS["."];
  }

  // Handle alternation (|)
  if (type === "alternation") {
    return SPECIAL_DESCRIPTIONS["|"];
  }

  // Handle character classes [...]
  if (type === "character-class") {
    const isNegated = value.startsWith("[^");
    const inner = isNegated ? value.slice(2, -1) : value.slice(1, -1);

    // Common character class patterns
    if (inner === "a-z") {
      return {
        simple: isNegated
          ? "Any character EXCEPT lowercase letters"
          : "Any lowercase letter (a through z)",
        example: isNegated ? "Matches '1', 'A', '@', etc." : "Matches 'a', 'b', 'c', etc.",
      };
    }

    if (inner === "A-Z") {
      return {
        simple: isNegated
          ? "Any character EXCEPT uppercase letters"
          : "Any uppercase letter (A through Z)",
        example: isNegated ? "Matches '1', 'a', '@', etc." : "Matches 'A', 'B', 'C', etc.",
      };
    }

    if (inner === "a-zA-Z") {
      return {
        simple: isNegated ? "Any character EXCEPT letters" : "Any letter (upper or lowercase)",
        example: isNegated ? "Matches '1', '@', ' ', etc." : "Matches 'a', 'Z', 'm', etc.",
      };
    }

    if (inner === "0-9") {
      return {
        simple: isNegated ? "Any character EXCEPT digits" : "Any digit (same as \\d)",
        example: isNegated ? "Matches 'a', '@', ' ', etc." : "Matches '0', '5', '9', etc.",
      };
    }

    if (inner === "a-zA-Z0-9") {
      return {
        simple: isNegated
          ? "Any character EXCEPT letters and digits"
          : "Any letter or digit (alphanumeric)",
        example: isNegated ? "Matches '@', ' ', '-', etc." : "Matches 'a', 'Z', '5', etc.",
      };
    }

    // Generic character class
    return {
      simple: isNegated
        ? `Any character NOT in this set: ${inner}`
        : `Any single character from: ${inner}`,
      example: isNegated
        ? "Matches anything not listed inside [ ]"
        : "Matches exactly one character from the set",
    };
  }

  // Handle groups
  if (type === "group") {
    // Capturing group
    if (description === "Capturing group") {
      return {
        simple: "Captures this part for later use",
        example: "What's inside can be referenced with \\1, \\2, etc.",
      };
    }

    // Non-capturing group
    if (description === "Non-capturing group") {
      return {
        simple: "Groups without capturing (just for organization)",
        example: "(?:cat|dog)s matches 'cats' or 'dogs'",
      };
    }

    // Named capturing group
    if (description?.startsWith("Named capturing group")) {
      const nameMatch = description.match(/"([^"]+)"/);
      const name = nameMatch ? nameMatch[1] : "name";
      return {
        simple: `Captures this part with the name '${name}'`,
        example: `Can reference later with \\k<${name}>`,
      };
    }

    // Lookahead
    if (description?.includes("Positive lookahead")) {
      return {
        simple: "Only matches if followed by this (doesn't consume)",
        example: "\\d(?=px) matches '5' in '5px' but not in '5em'",
      };
    }

    if (description?.includes("Negative lookahead")) {
      return {
        simple: "Only matches if NOT followed by this",
        example: "\\d(?!px) matches '5' in '5em' but not in '5px'",
      };
    }

    // Lookbehind
    if (description?.includes("Positive lookbehind")) {
      return {
        simple: "Only matches if preceded by this (doesn't consume)",
        example: "(?<=\\$)\\d+ matches '50' in '$50' but not in '50'",
      };
    }

    if (description?.includes("Negative lookbehind")) {
      return {
        simple: "Only matches if NOT preceded by this",
        example: "(?<!\\$)\\d+ matches '50' alone but not in '$50'",
      };
    }

    return {
      simple: description || "Group",
    };
  }

  // Handle literals
  if (type === "literal") {
    if (value.length === 1) {
      return {
        simple: `Matches the exact character '${value}'`,
      };
    }
    return {
      simple: `Matches the exact text '${value}'`,
    };
  }

  // Fallback
  return {
    simple: description || `${type}: ${value}`,
  };
}

/**
 * Format a beginner description for display
 */
export function formatBeginnerDescription(token: PatternToken): string {
  const desc = getBeginnerDescription(token);
  if (desc.example) {
    return `${desc.simple}\n\nExample: ${desc.example}`;
  }
  return desc.simple;
}

/**
 * Get just the simple description (no example)
 */
export function getSimpleDescription(token: PatternToken): string {
  return getBeginnerDescription(token).simple;
}

/**
 * Get just the example (if any)
 */
export function getDescriptionExample(token: PatternToken): string | undefined {
  return getBeginnerDescription(token).example;
}
