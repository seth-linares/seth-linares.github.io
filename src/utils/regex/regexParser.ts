// src/utils/regex/regexParser.ts
import type {
    CharacterClassResult,
    EscapeResult,
    GroupResult,
    PatternToken,
    QuantifierResult,
    RegexFlags,
} from '@/types/regex';

/**
 * Parser configuration limits to prevent performance issues and stack overflow
 */
const PARSER_LIMITS = {
    /** Maximum nesting depth for groups to prevent stack overflow */
    MAX_NESTING_DEPTH: 50,
    /** Quantifier values above this threshold trigger performance warnings */
    LARGE_QUANTIFIER_THRESHOLD: 10000,
    /** Nesting depth above this threshold triggers performance warnings */
    DEEP_NESTING_WARNING_THRESHOLD: 10,
} as const;

/**
 * Unicode property descriptions for \p{...} escape sequences
 * Maps property names to beginner-friendly descriptions
 */
const UNICODE_PROPERTY_DESCRIPTIONS: Record<string, string> = {
    // General categories
    Letter: 'any letter in any language',
    L: 'any letter in any language',
    Uppercase_Letter: 'any uppercase letter',
    Lu: 'any uppercase letter',
    Lowercase_Letter: 'any lowercase letter',
    Ll: 'any lowercase letter',
    Titlecase_Letter: 'any titlecase letter',
    Lt: 'any titlecase letter',
    Modifier_Letter: 'any modifier letter',
    Lm: 'any modifier letter',
    Other_Letter: 'any other letter',
    Lo: 'any other letter',
    Number: 'any numeric character',
    N: 'any numeric character',
    Decimal_Number: 'any decimal digit',
    Nd: 'any decimal digit',
    Letter_Number: 'any letter number (like Roman numerals)',
    Nl: 'any letter number',
    Other_Number: 'any other numeric character',
    No: 'any other numeric character',
    Punctuation: 'any punctuation character',
    P: 'any punctuation character',
    Symbol: 'any symbol character',
    S: 'any symbol character',
    Separator: 'any separator character',
    Z: 'any separator character',
    Mark: 'any mark character',
    M: 'any mark character',
    Other: 'any other character',
    C: 'any other character',
    // Common scripts
    'Script=Latin': 'Latin script characters (A-Z, accented letters)',
    'Script=Greek': 'Greek script characters (α, β, γ...)',
    'Script=Cyrillic': 'Cyrillic script characters',
    'Script=Arabic': 'Arabic script characters',
    'Script=Hebrew': 'Hebrew script characters',
    'Script=Han': 'Han/Chinese characters (漢字)',
    'Script=Hiragana': 'Japanese Hiragana characters (ひらがな)',
    'Script=Katakana': 'Japanese Katakana characters (カタカナ)',
    'Script=Thai': 'Thai script characters',
    'Script=Devanagari': 'Devanagari script characters (used in Hindi)',
    // Binary properties
    ASCII: 'ASCII characters (0-127)',
    Alphabetic: 'alphabetic characters',
    Emoji: 'emoji characters',
    Emoji_Presentation: 'emoji with default emoji presentation',
    White_Space: 'whitespace characters',
};

/**
 * Gets a beginner-friendly description for a Unicode property escape
 */
function getUnicodePropertyDescription(property: string, isNegated: boolean): string {
    const baseDesc = UNICODE_PROPERTY_DESCRIPTIONS[property] || `Unicode property "${property}"`;
    return isNegated ? `Matches any character that is NOT ${baseDesc}` : `Matches ${baseDesc}`;
}

/**
 * Checks if a character class inner content contains actual ranges (e.g., a-z)
 * Excludes escaped hyphens (\-) and hyphens at start/end (which are literal)
 */
function hasCharacterRange(inner: string): boolean {
    // Empty or single char can't have ranges
    if (inner.length < 3) return false;

    // Check for actual range pattern: char-char where hyphen is not escaped
    // and not at start or end position
    for (let i = 1; i < inner.length - 1; i++) {
        if (inner[i] === '-') {
            // Check if the hyphen is escaped (preceded by backslash)
            // Need to handle multiple backslashes: \\\- vs \\-
            let backslashCount = 0;
            let j = i - 1;
            while (j >= 0 && inner[j] === '\\') {
                backslashCount++;
                j--;
            }
            // If odd number of backslashes, the hyphen is escaped
            if (backslashCount % 2 === 0) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Parses a character class starting at the given position.
 * Handles edge cases like []], [^]], [\d\w], [-a], [a-].
 */
function parseCharacterClass(pattern: string, start: number): CharacterClassResult | null {
    if (pattern[start] !== '[') return null;

    let pos = start + 1;
    let negated = false;

    // Check for negation
    if (pos < pattern.length && pattern[pos] === '^') {
        negated = true;
        pos++;
    }

    // Handle special case where ] is first character (literal ])
    if (pos < pattern.length && pattern[pos] === ']') {
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

        if (c === '\\') {
            escaped = true;
            pos++;
            continue;
        }

        if (c === ']') {
            break;
        }

        pos++;
    }

    // Check if we found the closing ]
    if (pos >= pattern.length || pattern[pos] !== ']') {
        return null; // Invalid character class
    }

    const value = pattern.slice(start, pos + 1);
    const inner = pattern.slice(start + (negated ? 2 : 1), pos);

    let description = negated
        ? 'Matches any character NOT in the set'
        : 'Matches any single character in the set';

    // Add more specific description based on content
    if (inner.includes('\\d') || inner.includes('\\w') || inner.includes('\\s')) {
        description += ' (includes escape sequences)';
    } else if (hasCharacterRange(inner)) {
        description += ' (includes ranges)';
    }

    return {
        value,
        end: pos + 1,
        description,
    };
}

/**
 * Parses escape sequences including character escapes, hex, unicode, etc.
 */
function parseEscapeSequence(pattern: string, start: number): EscapeResult | null {
    if (pattern[start] !== '\\') return null;
    if (start + 1 >= pattern.length) return null;

    const next = pattern[start + 1];

    // Basic character class escapes
    const basicEscapes: Record<string, string> = {
        d: 'Matches any digit (0-9)',
        D: 'Matches any non-digit',
        w: 'Matches any word character (a-z, A-Z, 0-9, _)',
        W: 'Matches any non-word character',
        s: 'Matches any whitespace character',
        S: 'Matches any non-whitespace character',
        b: 'Word boundary',
        B: 'Non-word boundary',
        n: 'Newline character',
        t: 'Tab character',
        r: 'Carriage return',
        f: 'Form feed',
        v: 'Vertical tab',
        '0': 'Null character',
    };

    if (basicEscapes[next]) {
        return {
            value: pattern.slice(start, start + 2),
            end: start + 2,
            description: basicEscapes[next],
        };
    }

    // Escaped meta-characters
    const metaCharacters = '()[]{}.*+?|^$\\';
    if (metaCharacters.includes(next)) {
        return {
            value: pattern.slice(start, start + 2),
            end: start + 2,
            description: `Literal ${next} character (escaped)`,
        };
    }

    // Hexadecimal escapes \xNN
    if (next === 'x') {
        if (start + 4 <= pattern.length) {
            const hex = pattern.slice(start + 2, start + 4);
            if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
                const charCode = parseInt(hex, 16);
                const charName =
                    charCode < 32
                        ? 'control character'
                        : `character '${String.fromCharCode(charCode)}'`;
                return {
                    value: pattern.slice(start, start + 4),
                    end: start + 4,
                    description: `Hexadecimal escape for ${charName} (\\x${hex.toUpperCase()})`,
                };
            } else {
                // Invalid hex digits
                return {
                    value: pattern.slice(start, start + 4),
                    end: start + 4,
                    description: 'Invalid hexadecimal escape (treated as literal characters)',
                };
            }
        } else {
            // Incomplete hex escape
            const available = pattern.slice(start + 2);
            return {
                value: pattern.slice(start, start + 2 + available.length),
                end: start + 2 + available.length,
                description: 'Incomplete hexadecimal escape (\\x requires 2 hex digits)',
            };
        }
    }

    // Unicode escapes \uNNNN and \u{NNNNNN}
    if (next === 'u') {
        // Check for extended syntax \u{NNNNNN} FIRST (before basic \uNNNN)
        if (start + 2 < pattern.length && pattern[start + 2] === '{') {
            let pos = start + 3;
            while (pos < pattern.length && pattern[pos] !== '}') {
                if (!/[0-9A-Fa-f]/.test(pattern[pos])) break;
                pos++;
            }
            if (pos < pattern.length && pattern[pos] === '}') {
                const unicode = pattern.slice(start + 3, pos);
                if (unicode.length > 0 && unicode.length <= 6) {
                    const charCode = parseInt(unicode, 16);
                    try {
                        const charName = String.fromCodePoint(charCode);
                        return {
                            value: pattern.slice(start, pos + 1),
                            end: pos + 1,
                            description: `Extended Unicode escape for '${charName}' (\\u{${unicode.toUpperCase()}})`,
                        };
                    } catch {
                        return {
                            value: pattern.slice(start, pos + 1),
                            end: pos + 1,
                            description: `Extended Unicode escape (\\u{${unicode.toUpperCase()}})`,
                        };
                    }
                }
            }
            // Malformed \u{ - fall through to basic handling or treat as invalid
        }

        // Basic \uNNNN (4 hex digits)
        if (start + 6 <= pattern.length) {
            const unicode = pattern.slice(start + 2, start + 6);
            if (/^[0-9A-Fa-f]{4}$/.test(unicode)) {
                const charCode = parseInt(unicode, 16);
                const charName = String.fromCharCode(charCode);
                return {
                    value: pattern.slice(start, start + 6),
                    end: start + 6,
                    description: `Unicode escape for '${charName}' (\\u${unicode.toUpperCase()})`,
                };
            } else {
                // Invalid unicode digits
                return {
                    value: pattern.slice(start, start + 6),
                    end: start + 6,
                    description: 'Invalid Unicode escape (treated as literal characters)',
                };
            }
        } else {
            // Incomplete unicode escape
            const available = pattern.slice(start + 2);
            return {
                value: pattern.slice(start, start + 2 + available.length),
                end: start + 2 + available.length,
                description: 'Incomplete Unicode escape (\\u requires 4 hex digits)',
            };
        }
    }

    // Unicode property escapes \p{...} and \P{...}
    if (
        (next === 'p' || next === 'P') &&
        start + 2 < pattern.length &&
        pattern[start + 2] === '{'
    ) {
        let pos = start + 3;
        // Find the closing brace, allowing property names like "Script=Latin"
        while (pos < pattern.length && pattern[pos] !== '}') {
            pos++;
        }
        if (pos < pattern.length && pattern[pos] === '}') {
            const property = pattern.slice(start + 3, pos);
            if (property.length > 0) {
                const isNegated = next === 'P';
                return {
                    value: pattern.slice(start, pos + 1),
                    end: pos + 1,
                    description: getUnicodePropertyDescription(property, isNegated),
                };
            }
        }
        // Malformed property escape - treat as literal
        return {
            value: pattern.slice(start, start + 2),
            end: start + 2,
            description: `Literal '${next}' character (escaped) - incomplete property escape`,
        };
    }

    // Control characters \cX
    if (next === 'c' && start + 2 < pattern.length) {
        const controlChar = pattern[start + 2];
        if (/[A-Za-z]/.test(controlChar)) {
            return {
                value: pattern.slice(start, start + 3),
                end: start + 3,
                description: `Control character Ctrl+${controlChar.toUpperCase()}`,
            };
        }
    }

    // Named backreferences \k<name>
    if (next === 'k' && start + 2 < pattern.length && pattern[start + 2] === '<') {
        let pos = start + 3;
        while (pos < pattern.length && pattern[pos] !== '>') {
            pos++;
        }
        if (pos < pattern.length && pattern[pos] === '>') {
            const groupName = pattern.slice(start + 3, pos);
            return {
                value: pattern.slice(start, pos + 1),
                end: pos + 1,
                description: `Named backreference to group "${groupName}"`,
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
            description: `Backreference to capture group ${pattern.slice(start + 1, pos)}`,
        };
    }

    // Default: treat as literal escaped character
    return {
        value: pattern.slice(start, start + 2),
        end: start + 2,
        description: `Literal '${next}' character (escaped)`,
    };
}

/**
 * Parses various group types including lookarounds, named groups, etc.
 */
function parseGroup(
    pattern: string,
    start: number,
    flags: RegexFlags,
    depth: number = 0
): GroupResult | null {
    // Prevent excessive nesting that could cause stack overflow
    if (depth > PARSER_LIMITS.MAX_NESTING_DEPTH) {
        throw new Error(
            `Pattern too deeply nested (max depth: ${PARSER_LIMITS.MAX_NESTING_DEPTH})`
        );
    }
    if (pattern[start] !== '(') return null;

    let pos = start + 1;
    let groupType = 'capturing';
    let groupName: string | undefined;
    let description = 'Capturing group';

    // Check for special group types starting with ?
    if (pos < pattern.length && pattern[pos] === '?') {
        pos++;
        if (pos < pattern.length) {
            const specifier = pattern[pos];

            switch (specifier) {
                case ':':
                    pos++;
                    groupType = 'non-capturing';
                    description = 'Non-capturing group';
                    break;

                case '=':
                    pos++;
                    groupType = 'positive-lookahead';
                    description = 'Positive lookahead - matches if followed by this pattern';
                    break;

                case '!':
                    pos++;
                    groupType = 'negative-lookahead';
                    description = 'Negative lookahead - matches if NOT followed by this pattern';
                    break;

                case '<':
                    pos++;
                    if (pos < pattern.length) {
                        if (pattern[pos] === '=') {
                            pos++;
                            groupType = 'positive-lookbehind';
                            description =
                                'Positive lookbehind - matches if preceded by this pattern';
                        } else if (pattern[pos] === '!') {
                            pos++;
                            groupType = 'negative-lookbehind';
                            description =
                                'Negative lookbehind - matches if NOT preceded by this pattern';
                        } else {
                            // Named capture group (?<name>...)
                            const nameStart = pos;
                            while (pos < pattern.length && pattern[pos] !== '>') {
                                pos++;
                            }
                            if (pos < pattern.length && pattern[pos] === '>') {
                                groupName = pattern.slice(nameStart, pos);
                                pos++;
                                groupType = 'named-capturing';
                                description = `Named capturing group "${groupName}"`;
                            }
                        }
                    }
                    break;

                default:
                    // Handle inline modifiers like (?i:...) if needed
                    groupType = 'non-capturing';
                    description = 'Non-capturing group with modifiers';
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

        if (c === '\\') {
            escaped = true;
            pos++;
            continue;
        }

        if (c === '(') parenDepth++;
        if (c === ')') parenDepth--;
        pos++;
    }

    if (parenDepth > 0) {
        return null; // Unclosed group
    }

    const value = pattern.slice(start, pos);
    const innerStart =
        groupType === 'capturing'
            ? start + 1
            : groupName
              ? start + groupName.length + 4 // (?<name>
              : start + 3; // (?:, (?=, etc.
    const inner = pattern.slice(innerStart, pos - 1);

    return {
        value,
        end: pos,
        description,
        groupType,
        groupName,
        children: inner ? parseRegexPatternInternal(inner, flags, depth + 1) : [],
    };
}

/**
 * Parses {m,n} style quantifiers with lazy support
 */
function parseQuantifier(pattern: string, start: number): QuantifierResult | null {
    if (pattern[start] !== '{') return null;

    let pos = start + 1;
    let content = '';

    // Extract the quantifier content
    while (pos < pattern.length && pattern[pos] !== '}') {
        content += pattern[pos];
        pos++;
    }

    if (pos >= pattern.length || pattern[pos] !== '}') {
        return null; // Invalid quantifier
    }

    pos++; // Move past }

    // Check for lazy modifier
    let lazy = false;
    if (pos < pattern.length && pattern[pos] === '?') {
        lazy = true;
        pos++;
    }

    // Parse the quantifier content
    let description = 'Quantifier';

    if (!content) {
        description = 'Empty quantifier (invalid)';
    } else {
        const parts = content.split(',');

        if (parts.length === 1) {
            // {n} - exactly n times
            const num = parts[0].trim();
            if (/^\d+$/.test(num)) {
                const count = parseInt(num);
                if (count > PARSER_LIMITS.LARGE_QUANTIFIER_THRESHOLD) {
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

            if (min === '' && max !== '') {
                // {,n} - up to n times (non-standard)
                if (/^\d+$/.test(max)) {
                    description = `Matches up to ${max} times`;
                } else {
                    description = `Invalid quantifier max value "${max}"`;
                }
            } else if (min !== '' && max === '') {
                // {n,} - n or more times
                if (/^\d+$/.test(min)) {
                    description = `Matches ${min} or more times`;
                } else {
                    description = `Invalid quantifier min value "${min}"`;
                }
            } else if (min !== '' && max !== '') {
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
                description = 'Empty quantifier range (invalid)';
            }
        } else {
            description = `Invalid quantifier format "${content}"`;
        }
    }

    if (lazy) {
        description += ' (lazy/non-greedy)';
    } else {
        description += ' (greedy)';
    }

    return {
        value: pattern.slice(start, pos),
        end: pos,
        description,
    };
}

/**
 * Checks if a group's content has a required literal boundary (prefix OR suffix) that prevents backtracking.
 * Patterns like (?:-[a-z]+)* are safe because '-' MUST match first.
 * Patterns like (?:\d{1,3}\.){3} are safe because '\.' MUST match at the end of each repetition.
 */
function hasRequiredLiteralBoundary(groupContent: string): boolean {
    // Skip non-capturing group prefix if present
    const content = groupContent.replace(/^\?:/, '');

    // Check for required literal PREFIX (start of group)
    // The key is that the FIRST element must NOT be quantified at all.

    // Starts with escaped character NOT quantified (like \. in \.[a-z]+)
    if (/^\\[.dDwWsS](?![*+?{])/.test(content)) {
        return true;
    }

    // Starts with a plain literal char NOT followed by any quantifier
    // e.g., '-' in -[a-z]+ is a required prefix, but 'a' in a+ is NOT
    if (/^[a-zA-Z0-9\-_.,:;!@#$%&=<>'"/](?![*+?{])/.test(content)) {
        return true;
    }

    // Starts with a character class NOT followed by any quantifier
    // e.g., [A-Z] in [A-Z][a-z]+ is required, but [a-z] in [a-z]+ is NOT
    if (/^\[[^\]]+\](?![*+?{])/.test(content)) {
        return true;
    }

    // Check for required literal SUFFIX (end of group)
    // e.g., \d{1,3}\. has \. at the end which creates an unambiguous boundary

    // Ends with escaped character (like \. in \d{1,3}\.)
    if (/\\[.dDwWsS]$/.test(content)) {
        return true;
    }

    // Ends with a plain literal char not preceded by a quantifier
    // e.g., 'x' at end if not part of a quantifier like {1,3}
    if (/[a-zA-Z0-9\-_.,:;!@#$%&=<>'"/]$/.test(content) && !/[*+?}].$/.test(content)) {
        return true;
    }

    return false;
}

/**
 * Checks if two alternatives in an alternation are disjoint (can't match the same input).
 * Patterns like ([^"\\]|\\.)* are safe because the alternatives can never overlap.
 */
function areAlternativesDisjoint(alt1: string, alt2: string): boolean {
    // Negated char class vs escaped sequence - these are commonly disjoint
    // e.g., [^"\\] can't match what \\. matches (backslash + any char)
    const negatedClassPattern = /^\[\^/;
    const escapedPattern = /^\\\\/;

    if (
        (negatedClassPattern.test(alt1) && escapedPattern.test(alt2)) ||
        (negatedClassPattern.test(alt2) && escapedPattern.test(alt1))
    ) {
        return true;
    }

    // Two different literal characters are disjoint
    const literalChar1 = alt1.match(/^[a-zA-Z0-9]$/);
    const literalChar2 = alt2.match(/^[a-zA-Z0-9]$/);
    if (literalChar1 && literalChar2 && alt1 !== alt2) {
        return true;
    }

    return false;
}

/**
 * Detects potentially dangerous regex patterns that could cause ReDoS (Regular Expression Denial of Service)
 */
function detectPotentialReDoS(pattern: string): string[] {
    const warnings: string[] = [];

    // Nested quantifiers: (a+)+, (a*)+, etc.
    // But skip if the group has a required literal boundary that prevents backtracking
    const groupWithQuantifier = /\((\?:)?([^)]+)\)([*+?]|\{[0-9,]+\})/g;
    let match;
    let foundNestedQuantifier = false;

    while ((match = groupWithQuantifier.exec(pattern)) !== null) {
        const groupContent = match[2];
        const outerQuantifier = match[3];

        // Check if inner content has a quantifier
        const hasInnerQuantifier = /[*+?]|\{[0-9,]+\}/.test(groupContent);

        if (
            hasInnerQuantifier &&
            (outerQuantifier === '*' || outerQuantifier === '+' || outerQuantifier.startsWith('{'))
        ) {
            // This COULD be dangerous, but check for safe patterns
            if (!hasRequiredLiteralBoundary(groupContent)) {
                warnings.push(
                    'Nested quantifiers like (a+)+ can be VERY slow on long text. Try simplifying - for example, (a+)+ can usually be replaced with just a+'
                );
                foundNestedQuantifier = true;
                break;
            }
        }
    }

    // Alternation with quantifiers: (a|b)+
    // But skip if alternatives are disjoint
    if (!foundNestedQuantifier) {
        const altWithQuantifier = /\((\?:)?([^)|]+)\|([^)]+)\)([*+?]|\{[0-9,]+\})/g;
        while ((match = altWithQuantifier.exec(pattern)) !== null) {
            const alt1 = match[2];
            const alt2 = match[3];

            // Check if alternatives could overlap
            if (!areAlternativesDisjoint(alt1, alt2)) {
                warnings.push(
                    'OR patterns with repeaters like (cat|car)+ can be slow if the options share characters. Consider rewriting as ca(t|r)+ if possible'
                );
                break;
            }
        }
    }

    // Multiple consecutive quantifiers (invalid but dangerous): a++, b**
    // But NOT escaped characters like \+? (escaped plus followed by optional)
    // Use negative lookbehind to exclude escaped characters
    if (/(?<!\\)[*+?][*+?]/.test(pattern)) {
        warnings.push(
            'Two quantifiers in a row (like ++ or *?) is invalid. Each quantifier should follow something to repeat, like a+ or \\d*'
        );
    }

    // Very large quantifiers: {999999}
    const largeQuantifier = pattern.match(/\{(\d+)(?:,(\d+))?\}/g);
    if (largeQuantifier) {
        for (const quant of largeQuantifier) {
            const numbers = quant.match(/\d+/g);
            if (
                numbers &&
                numbers.some((n) => parseInt(n) > PARSER_LIMITS.LARGE_QUANTIFIER_THRESHOLD)
            ) {
                warnings.push(
                    'Quantifier values over 10,000 can make matching very slow. Consider if you really need such large repetitions'
                );
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

    if (maxDepth > PARSER_LIMITS.DEEP_NESTING_WARNING_THRESHOLD) {
        warnings.push(
            'Your pattern has many nested groups (over 10 levels deep). This can slow down matching. Try to flatten or simplify if possible'
        );
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
        tokens.forEach((token) => {
            if (token.type === 'group') {
                // Only count capturing groups (not lookarounds)
                if (
                    !token.description?.includes('lookahead') &&
                    !token.description?.includes('lookbehind')
                ) {
                    if (token.description?.includes('Named capturing')) {
                        // Extract group name from description
                        const nameMatch = token.description.match(/"([^"]+)"/);
                        if (nameMatch) {
                            const groupName = nameMatch[1];
                            if (namedGroups.has(groupName)) {
                                warnings.push(
                                    `You have two groups named "${groupName}". Each named group should have a unique name`
                                );
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
        tokens.forEach((token) => {
            if (token.type === 'escape') {
                // Check numbered backreferences
                const numberedMatch = token.value.match(/^\\(\d+)$/);
                if (numberedMatch) {
                    const refNum = parseInt(numberedMatch[1]);
                    if (refNum > capturingGroupCount) {
                        warnings.push(
                            `\\${refNum} refers to capture group #${refNum}, but you only have ${capturingGroupCount} group${capturingGroupCount !== 1 ? 's' : ''}. Check your group numbering`
                        );
                    }
                }

                // Check named backreferences
                const namedMatch = token.value.match(/^\\k<([^>]+)>$/);
                if (namedMatch) {
                    const refName = namedMatch[1];
                    if (!namedGroups.has(refName)) {
                        warnings.push(
                            `\\k<${refName}> refers to a group named "${refName}", but no group with that name exists. Make sure you have (?<${refName}>...) somewhere in your pattern`
                        );
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

    // Validate character class ranges for invalid patterns like [z-a]
    function validateCharacterClassRanges(token: PatternToken): void {
        if (token.type !== 'character-class') return;

        // Extract inner content (remove [ ] and optional ^ for negation)
        let inner = token.value.slice(1, -1);
        if (inner.startsWith('^')) {
            inner = inner.slice(1);
        }

        // Handle special case: ] as first char is literal
        if (inner.startsWith(']')) {
            inner = inner.slice(1);
        }

        // Find ranges and validate them
        // A range is char-char where the hyphen is not at start/end and not escaped
        let i = 0;
        while (i < inner.length) {
            // Skip escaped characters
            if (inner[i] === '\\' && i + 1 < inner.length) {
                i += 2;
                continue;
            }

            // Check for hyphen that could be a range
            if (inner[i] === '-' && i > 0 && i < inner.length - 1) {
                // Get the character before the hyphen
                const startChar = inner[i - 1];
                // Handle if previous char was an escape sequence
                if (i >= 2 && inner[i - 2] === '\\') {
                    // This is an escaped char like \d- which isn't a valid range start
                    i++;
                    continue;
                }

                // Get the character after the hyphen
                const endChar = inner[i + 1];
                // Handle if next char is escaped
                if (endChar === '\\' && i + 2 < inner.length) {
                    // Escaped char after hyphen - not a simple range
                    i++;
                    continue;
                }

                // Validate the range
                if (startChar.charCodeAt(0) > endChar.charCodeAt(0)) {
                    warnings.push(
                        `Invalid character range [${startChar}-${endChar}]: '${startChar}' (code ${startChar.charCodeAt(0)}) comes after '${endChar}' (code ${endChar.charCodeAt(0)}) - ranges must go from lower to higher`
                    );
                }
            }
            i++;
        }
    }

    // Check for other pattern issues
    function checkPatternIssues(tokens: PatternToken[]): void {
        tokens.forEach((token, index) => {
            // Check for quantifiers on anchors (usually invalid)
            if (token.type === 'anchor' && index + 1 < tokens.length) {
                const nextToken = tokens[index + 1];
                if (nextToken.type === 'quantifier') {
                    warnings.push(
                        `${token.value}${nextToken.value} doesn't make sense - ${token.value} matches a position (not a character), so you can't repeat it. Remove the ${nextToken.value}`
                    );
                }
            }

            // Check for quantifiers on lookarounds (usually invalid)
            if (
                token.type === 'group' &&
                token.description?.includes('look') &&
                index + 1 < tokens.length
            ) {
                const nextToken = tokens[index + 1];
                if (nextToken.type === 'quantifier') {
                    warnings.push(
                        `You can't repeat a ${token.description?.toLowerCase() || 'lookaround'} with ${nextToken.value}. Lookarounds check conditions but don't consume characters, so repeating them doesn't work`
                    );
                }
            }

            // Check for invalid character class ranges
            if (token.type === 'character-class') {
                validateCharacterClassRanges(token);
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
                } else if (nextToken?.type === 'escape' && /\\[wdDWsS]/.test(nextToken.value)) {
                    enhancedDescription = 'Word boundary (start of word)';
                } else if (prevToken?.type === 'escape' && /\\[wdDWsS]/.test(prevToken.value)) {
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
            if (
                token.value.includes('0-9') &&
                token.value.includes('a-z') &&
                token.value.includes('A-Z')
            ) {
                enhancedDescription = 'Matches alphanumeric characters (letters and digits)';
            } else if (
                token.value.includes('0-9') &&
                (token.value.includes('a-f') || token.value.includes('A-F'))
            ) {
                enhancedDescription = 'Matches hexadecimal digits (0-9, A-F)';
            } else if (token.value.includes('a-z') && flags?.i) {
                enhancedDescription += ' (case-insensitive due to i flag)';
            } else if (token.value.includes('A-Z') && flags?.i) {
                enhancedDescription += ' (case-insensitive due to i flag)';
            }
        }

        // Enhance dot descriptions based on context and flags
        if (token.type === 'wildcard' && token.value === '.') {
            if (
                index > 0 &&
                tokens[index - 1].type === 'escape' &&
                tokens[index - 1].value === '\\'
            ) {
                // This shouldn't happen with proper parsing, but just in case
                enhancedDescription = 'Literal dot character (escaped)';
            } else if (index + 1 < tokens.length && tokens[index + 1].type === 'quantifier') {
                const quantifier = tokens[index + 1];
                if (quantifier.value === '*' || quantifier.value === '+') {
                    if (flags?.s) {
                        enhancedDescription +=
                            ' (matches any sequence of characters including newlines)';
                    } else {
                        enhancedDescription +=
                            ' (matches any sequence of characters except newlines)';
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
        const enhancedChildren = token.children
            ? enhanceDescriptions(token.children, flags)
            : token.children;

        return {
            ...token,
            description: enhancedDescription,
            children: enhancedChildren,
        };
    });

    return enhanced;
}

/**
 * Internal parser with depth tracking for recursion safety
 */
function parseRegexPatternInternal(
    pattern: string,
    flags?: Partial<RegexFlags>,
    depth: number = 0
): PatternToken[] {
    const resolvedFlags: RegexFlags = {
        g: false,
        i: false,
        m: false,
        s: false,
        u: false,
        y: false,
        ...flags,
    };
    const tokens: PatternToken[] = [];
    let i = 0;

    while (i < pattern.length) {
        const char = pattern[i];
        const start = i;

        try {
            // Character class [...]
            if (char === '[') {
                const result = parseCharacterClass(pattern, i);
                if (result) {
                    tokens.push({
                        type: 'character-class',
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
            if (char === '\\' && i + 1 < pattern.length) {
                const escapeResult = parseEscapeSequence(pattern, i);
                if (escapeResult) {
                    tokens.push({
                        type: 'escape',
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
            if (char === '*' || char === '+' || char === '?') {
                let quantifierEnd = i + 1;
                let lazy = false;

                // Check for lazy modifier
                if (quantifierEnd < pattern.length && pattern[quantifierEnd] === '?') {
                    lazy = true;
                    quantifierEnd++;
                }

                const quantifierValue = pattern.slice(i, quantifierEnd);
                const baseDescription =
                    char === '*'
                        ? '0 or more times'
                        : char === '+'
                          ? '1 or more times'
                          : '0 or 1 time';

                const description = lazy
                    ? `Matches ${baseDescription} (lazy/non-greedy)`
                    : `Matches ${baseDescription} (greedy)`;

                tokens.push({
                    type: 'quantifier',
                    value: quantifierValue,
                    start,
                    end: quantifierEnd,
                    description,
                    // Link to the token being quantified (previous token)
                    targetIndex: tokens.length > 0 ? tokens.length - 1 : undefined,
                });
                i = quantifierEnd;
                continue;
            }
            if (char === '{') {
                const quantifierResult = parseQuantifier(pattern, i);
                if (quantifierResult) {
                    tokens.push({
                        type: 'quantifier',
                        value: quantifierResult.value,
                        start,
                        end: quantifierResult.end,
                        description: quantifierResult.description,
                        // Link to the token being quantified (previous token)
                        targetIndex: tokens.length > 0 ? tokens.length - 1 : undefined,
                    });
                    i = quantifierResult.end;
                    continue;
                }
            }

            // Anchors ^ and $
            if (char === '^' || char === '$') {
                const anchorDescription =
                    char === '^'
                        ? resolvedFlags.m
                            ? 'Start of line (multiline mode)'
                            : 'Start of string'
                        : resolvedFlags.m
                          ? 'End of line (multiline mode)'
                          : 'End of string';
                tokens.push({
                    type: 'anchor',
                    value: char,
                    start,
                    end: i + 1,
                    description: anchorDescription,
                });
                i++;
                continue;
            }

            // Groups (...) - supports all group types
            if (char === '(') {
                const groupResult = parseGroup(pattern, i, resolvedFlags, depth);
                if (groupResult) {
                    tokens.push({
                        type: 'group',
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
            if (char === '|') {
                tokens.push({
                    type: 'alternation',
                    value: '|',
                    start,
                    end: i + 1,
                    description: 'Alternation (OR)',
                });
                i++;
                continue;
            }

            // Dot .
            if (char === '.') {
                const dotDescription = resolvedFlags.s
                    ? 'Matches any character including line terminators (dotAll flag enabled)'
                    : 'Matches any character except line terminators';
                tokens.push({
                    type: 'wildcard',
                    value: '.',
                    start,
                    end: i + 1,
                    description: dotDescription,
                });
                i++;
                continue;
            }

            // Literal character
            tokens.push({
                type: 'literal',
                value: char,
                start,
                end: i + 1,
                description: `Matches the character "${char}"`,
            });
            i++;
        } catch {
            // Error recovery: treat as unknown/literal token
            tokens.push({
                type: 'unknown',
                value: char,
                start,
                end: i + 1,
                description: `Unknown or malformed pattern element "${char}"`,
            });
            i++;
        }
    }

    // Annotate alternation branches if alternation exists
    return annotateAlternationBranches(tokens);
}

/**
 * Annotates tokens with branchIndex for alternation patterns
 * For example: cat|dog results in c,a,t having branchIndex 0 and d,o,g having branchIndex 1
 */
function annotateAlternationBranches(tokens: PatternToken[]): PatternToken[] {
    const hasAlternation = tokens.some((t) => t.type === 'alternation');
    if (!hasAlternation) return tokens;

    let currentBranch = 0;
    return tokens.map((token) => {
        if (token.type === 'alternation') {
            currentBranch++;
            return token; // Don't annotate the pipe itself
        }

        // Recursively annotate children (for groups containing alternation)
        const annotatedChildren = token.children
            ? annotateAlternationBranches(token.children)
            : token.children;

        return {
            ...token,
            branchIndex: currentBranch,
            children: annotatedChildren,
        };
    });
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
        ...flags,
    };
    const tokens = parseRegexPatternInternal(pattern, flags, 0);
    return enhanceDescriptions(tokens, resolvedFlags);
}

/**
 * Enhanced parser that returns both tokens and analysis warnings
 */
export function parseRegexPatternWithWarnings(
    pattern: string,
    flags?: Partial<RegexFlags>
): {
    tokens: PatternToken[];
    warnings: string[];
} {
    const tokens = parseRegexPattern(pattern, flags);
    const redosWarnings = detectPotentialReDoS(pattern);
    const validationWarnings = validatePattern(tokens);

    return {
        tokens,
        warnings: [...redosWarnings, ...validationWarnings],
    };
}

/**
 * Basic parser without context enhancements (for performance-critical cases)
 */
export function parseRegexPatternBasic(
    pattern: string,
    flags?: Partial<RegexFlags>
): PatternToken[] {
    return parseRegexPatternInternal(pattern, flags, 0);
}
