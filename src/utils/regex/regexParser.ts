// src/utils/regex/regexParser.ts
import type { PatternToken } from "@/types/regex";

/**
 * Very lightweight regex pattern parser for visual explanation.
 * This is not a full RFC parser; it covers common constructs used in the playground.
 */
export function parseRegexPattern(pattern: string): PatternToken[] {
  const tokens: PatternToken[] = [];
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];
    const start = i;

    // Character class [...]
    if (char === "[") {
      let end = i + 1;
      let escaped = false;
      while (end < pattern.length) {
        const c = pattern[end];
        if (!escaped && c === "\\") {
          escaped = true;
          end++;
          continue;
        }
        if (!escaped && c === "]") break;
        escaped = false;
        end++;
      }
      if (end < pattern.length && pattern[end] === "]") {
        tokens.push({
          type: "character-class",
          value: pattern.slice(i, end + 1),
          start,
          end: end + 1,
          description: "Matches any single character in the set",
        });
        i = end + 1;
        continue;
      }
    }

    // Escape sequences like \d, \w, \s, \n, \t, etc.
    if (char === "\\" && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      const escapeMap: Record<string, string> = {
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

      tokens.push({
        type: "escape",
        value: char + next,
        start,
        end: i + 2,
        description: escapeMap[next] || `Escaped ${next} character`,
      });
      i += 2;
      continue;
    }

    // Quantifiers *, +, ?, and {m,n}
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({
        type: "quantifier",
        value: char,
        start,
        end: i + 1,
        description:
          char === "*"
            ? "Matches 0 or more times"
            : char === "+"
            ? "Matches 1 or more times"
            : "Matches 0 or 1 time",
      });
      i++;
      continue;
    }
    if (char === "{") {
      let j = i + 1;
      while (j < pattern.length && pattern[j] !== "}") j++;
      if (j < pattern.length && pattern[j] === "}") {
        tokens.push({
          type: "quantifier",
          value: pattern.slice(i, j + 1),
          start,
          end: j + 1,
          description: "Quantifier with explicit min/max",
        });
        i = j + 1;
        continue;
      }
    }

    // Anchors ^ and $
    if (char === "^" || char === "$") {
      tokens.push({
        type: "anchor",
        value: char,
        start,
        end: i + 1,
        description: char === "^" ? "Start of line" : "End of line",
      });
      i++;
      continue;
    }

    // Groups (...) (supports basic nested groups)
    if (char === "(") {
      let depth = 1;
      let j = i + 1;
      let isNonCapturing = false;
      if (pattern[j] === "?" && pattern[j + 1] === ":") {
        isNonCapturing = true;
      }
      while (j < pattern.length && depth > 0) {
        if (pattern[j] === "\\") {
          j += 2; // skip escaped char
          continue;
        }
        if (pattern[j] === "(") depth++;
        if (pattern[j] === ")") depth--;
        j++;
      }
      const end = j;
      const value = pattern.slice(i, end);
      const inner = value.slice(isNonCapturing ? 3 : 1, value.length - 1);
      tokens.push({
        type: "group",
        value,
        start,
        end,
        description: isNonCapturing ? "Non-capturing group" : "Capturing group",
        children: inner ? parseRegexPattern(inner) : [],
      });
      i = end;
      continue;
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
      tokens.push({
        type: "wildcard",
        value: ".",
        start,
        end: i + 1,
        description: "Matches any character (except line terminators unless dotAll)",
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
  }

  return tokens;
}
