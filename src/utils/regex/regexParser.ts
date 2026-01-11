// src/utils/regex/regexParser.ts
import type {
    CharacterClassResult,
    EscapeResult,
    GroupResult,
    PatternToken,
    QuantifierResult,
    RegexFlags,
} from '@/types/regex';

const PARSER_LIMITS = {
    MAX_NESTING_DEPTH: 50,

    LARGE_QUANTIFIER_THRESHOLD: 10000,

    DEEP_NESTING_WARNING_THRESHOLD: 10,
} as const;

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

function getUnicodePropertyDescription(property: string, isNegated: boolean): string {
    const baseDesc = UNICODE_PROPERTY_DESCRIPTIONS[property] || `Unicode property "${property}"`;
    return isNegated ? `Matches any character that is NOT ${baseDesc}` : `Matches ${baseDesc}`;
}

function hasCharacterRange(inner: string): boolean {
    if (inner.length < 3) return false;

    for (let i = 1; i < inner.length - 1; i++) {
        if (inner[i] === '-') {
            let backslashCount = 0;
            let j = i - 1;
            while (j >= 0 && inner[j] === '\\') {
                backslashCount++;
                j--;
            }
            if (backslashCount % 2 === 0) {
                return true;
            }
        }
    }
    return false;
}

function parseCharacterClass(pattern: string, start: number): CharacterClassResult | null {
    if (pattern[start] !== '[') return null;

    let pos = start + 1;
    let negated = false;

    // Check for negation
    if (pos < pattern.length && pattern[pos] === '^') {
        negated = true;
        pos++;
    }

    if (pos < pattern.length && pattern[pos] === ']') {
        pos++;
    }

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

    if (pos >= pattern.length || pattern[pos] !== ']') {
        return null;
    }

    const value = pattern.slice(start, pos + 1);
    const inner = pattern.slice(start + (negated ? 2 : 1), pos);

    let description = negated
        ? 'Matches any character NOT in the set'
        : 'Matches any single character in the set';

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

function parseEscapeSequence(pattern: string, start: number): EscapeResult | null {
    if (pattern[start] !== '\\') return null;
    if (start + 1 >= pattern.length) return null;

    const next = pattern[start + 1];

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

    if (next === 'u') {
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
        }

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

    if (
        (next === 'p' || next === 'P') &&
        start + 2 < pattern.length &&
        pattern[start + 2] === '{'
    ) {
        let pos = start + 3;
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

    return {
        value: pattern.slice(start, start + 2),
        end: start + 2,
        description: `Literal '${next}' character (escaped)`,
    };
}

function parseGroup(
    pattern: string,
    start: number,
    flags: RegexFlags,
    depth: number = 0
): GroupResult | null {
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
                    groupType = 'non-capturing';
                    description = 'Non-capturing group with modifiers';
                    break;
            }
        }
    }

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
        return null;
    }

    const value = pattern.slice(start, pos);
    const innerStart =
        groupType === 'capturing'
            ? start + 1
            : groupName
              ? start + groupName.length + 4
              : start + 3;
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

function parseQuantifier(pattern: string, start: number): QuantifierResult | null {
    if (pattern[start] !== '{') return null;

    let pos = start + 1;
    let content = '';

    while (pos < pattern.length && pattern[pos] !== '}') {
        content += pattern[pos];
        pos++;
    }

    if (pos >= pattern.length || pattern[pos] !== '}') {
        return null;
    }

    pos++;

    // Check for lazy modifier
    let lazy = false;
    if (pos < pattern.length && pattern[pos] === '?') {
        lazy = true;
        pos++;
    }

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

function hasRequiredLiteralBoundary(groupContent: string): boolean {
    const content = groupContent.replace(/^\?:/, '');

    if (/^\\[.dDwWsS](?![*+?{])/.test(content)) {
        return true;
    }

    if (/^[a-zA-Z0-9\-_.,:;!@#$%&=<>'"/](?![*+?{])/.test(content)) {
        return true;
    }

    if (/^\[[^\]]+\](?![*+?{])/.test(content)) {
        return true;
    }

    if (/\\[.dDwWsS]$/.test(content)) {
        return true;
    }

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
    const negatedClassPattern = /^\[\^/;
    const escapedPattern = /^\\\\/;

    if (
        (negatedClassPattern.test(alt1) && escapedPattern.test(alt2)) ||
        (negatedClassPattern.test(alt2) && escapedPattern.test(alt1))
    ) {
        return true;
    }

    const literalChar1 = alt1.match(/^[a-zA-Z0-9]$/);
    const literalChar2 = alt2.match(/^[a-zA-Z0-9]$/);
    if (literalChar1 && literalChar2 && alt1 !== alt2) {
        return true;
    }

    return false;
}

function detectPotentialReDoS(pattern: string): string[] {
    const warnings: string[] = [];

    const groupWithQuantifier = /\((\?:)?([^)]+)\)([*+?]|\{[0-9,]+\})/g;
    let match;
    let foundNestedQuantifier = false;

    while ((match = groupWithQuantifier.exec(pattern)) !== null) {
        const groupContent = match[2];
        const outerQuantifier = match[3];

        const hasInnerQuantifier = /[*+?]|\{[0-9,]+\}/.test(groupContent);

        if (
            hasInnerQuantifier &&
            (outerQuantifier === '*' || outerQuantifier === '+' || outerQuantifier.startsWith('{'))
        ) {
            if (!hasRequiredLiteralBoundary(groupContent)) {
                warnings.push(
                    'Nested quantifiers like (a+)+ can be VERY slow on long text. Try simplifying - for example, (a+)+ can usually be replaced with just a+'
                );
                foundNestedQuantifier = true;
                break;
            }
        }
    }

    if (!foundNestedQuantifier) {
        const altWithQuantifier = /\((\?:)?([^)|]+)\|([^)]+)\)([*+?]|\{[0-9,]+\})/g;
        while ((match = altWithQuantifier.exec(pattern)) !== null) {
            const alt1 = match[2];
            const alt2 = match[3];

            if (!areAlternativesDisjoint(alt1, alt2)) {
                warnings.push(
                    'OR patterns with repeaters like (cat|car)+ can be slow if the options share characters. Consider rewriting as ca(t|r)+ if possible'
                );
                break;
            }
        }
    }

    if (/(?<!\\)[*+?][*+?]/.test(pattern)) {
        warnings.push(
            'Two quantifiers in a row (like ++ or *?) is invalid. Each quantifier should follow something to repeat, like a+ or \\d*'
        );
    }

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

function validatePattern(tokens: PatternToken[]): string[] {
    const warnings: string[] = [];

    let capturingGroupCount = 0;
    const namedGroups = new Set<string>();

    function countGroups(tokens: PatternToken[]): void {
        tokens.forEach((token) => {
            if (token.type === 'group') {
                if (
                    !token.description?.includes('lookahead') &&
                    !token.description?.includes('lookbehind')
                ) {
                    if (token.description?.includes('Named capturing')) {
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

                if (token.children) {
                    countGroups(token.children);
                }
            }
        });
    }

    function validateBackreferences(tokens: PatternToken[]): void {
        tokens.forEach((token) => {
            if (token.type === 'escape') {
                const numberedMatch = token.value.match(/^\\(\d+)$/);
                if (numberedMatch) {
                    const refNum = parseInt(numberedMatch[1]);
                    if (refNum > capturingGroupCount) {
                        warnings.push(
                            `\\${refNum} refers to capture group #${refNum}, but you only have ${capturingGroupCount} group${capturingGroupCount !== 1 ? 's' : ''}. Check your group numbering`
                        );
                    }
                }

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

            if (token.children) {
                validateBackreferences(token.children);
            }
        });
    }

    // First pass: count groups
    countGroups(tokens);

    validateBackreferences(tokens);

    function validateCharacterClassRanges(token: PatternToken): void {
        if (token.type !== 'character-class') return;

        let inner = token.value.slice(1, -1);
        if (inner.startsWith('^')) {
            inner = inner.slice(1);
        }

        if (inner.startsWith(']')) {
            inner = inner.slice(1);
        }

        let i = 0;
        while (i < inner.length) {
            // Skip escaped characters
            if (inner[i] === '\\' && i + 1 < inner.length) {
                i += 2;
                continue;
            }

            if (inner[i] === '-' && i > 0 && i < inner.length - 1) {
                const startChar = inner[i - 1];
                if (i >= 2 && inner[i - 2] === '\\') {
                    i++;
                    continue;
                }

                const endChar = inner[i + 1];
                if (endChar === '\\' && i + 2 < inner.length) {
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

    function checkPatternIssues(tokens: PatternToken[]): void {
        tokens.forEach((token, index) => {
            if (token.type === 'anchor' && index + 1 < tokens.length) {
                const nextToken = tokens[index + 1];
                if (nextToken.type === 'quantifier') {
                    warnings.push(
                        `${token.value}${nextToken.value} doesn't make sense - ${token.value} matches a position (not a character), so you can't repeat it. Remove the ${nextToken.value}`
                    );
                }
            }

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

            if (token.type === 'character-class') {
                validateCharacterClassRanges(token);
            }

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

        if (token.type === 'wildcard' && token.value === '.') {
            if (
                index > 0 &&
                tokens[index - 1].type === 'escape' &&
                tokens[index - 1].value === '\\'
            ) {
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
            return token;
        }

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
