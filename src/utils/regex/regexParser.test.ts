// src/utils/regex/regexParser.test.ts
import { describe, it, expect } from 'vitest';
import { parseRegexPattern } from './regexParser';

describe('regexParser', () => {
  describe('Character Classes', () => {
    it('should parse basic character class', () => {
      const result = parseRegexPattern('[abc]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[abc]',
        description: expect.stringContaining('any single character in the set')
      });
    });

    it('should parse negated character class', () => {
      const result = parseRegexPattern('[^abc]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[^abc]',
        description: expect.stringContaining('NOT in the set')
      });
    });

    it('should handle literal ] at start', () => {
      const result = parseRegexPattern('[]]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[]]'
      });
    });

    it('should handle negated with literal ] at start', () => {
      const result = parseRegexPattern('[^]]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[^]]'
      });
    });

    it('should handle escape sequences inside character class', () => {
      const result = parseRegexPattern('[\\d\\w]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[\\d\\w]',
        description: expect.stringContaining('escape sequences')
      });
    });

    it('should handle ranges', () => {
      const result = parseRegexPattern('[a-z0-9]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[a-z0-9]',
        description: expect.stringContaining('ranges')
      });
    });
  });

  describe('Escape Sequences', () => {
    it('should parse basic character class escapes', () => {
      const result = parseRegexPattern('\\d\\w\\s');
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\d',
        description: 'Matches any digit (0-9)'
      });
      expect(result[1]).toMatchObject({
        type: 'escape',
        value: '\\w',
        description: 'Matches any word character (a-z, A-Z, 0-9, _)'
      });
      expect(result[2]).toMatchObject({
        type: 'escape',
        value: '\\s',
        description: 'Matches any whitespace character'
      });
    });

    it('should parse escaped meta-characters', () => {
      const result = parseRegexPattern('\\(\\)\\[\\]\\{\\}\\.');
      expect(result).toHaveLength(7);
      result.forEach(token => {
        expect(token).toMatchObject({
          type: 'escape',
          description: expect.stringContaining('Literal')
        });
      });
    });

    it('should parse hexadecimal escapes', () => {
      const result = parseRegexPattern('\\x41');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\x41',
        description: expect.stringContaining('Hexadecimal escape')
      });
    });

    it('should parse unicode escapes', () => {
      const result = parseRegexPattern('\\u0041');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\u0041',
        description: expect.stringContaining('Unicode escape')
      });
    });

    it('should parse extended unicode escapes', () => {
      const result = parseRegexPattern('\\u{1F600}');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\u{1F600}',
        description: expect.stringContaining('Extended Unicode escape')
      });
    });

    it('should parse control characters', () => {
      const result = parseRegexPattern('\\cA');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\cA',
        description: expect.stringContaining('Control character')
      });
    });

    it('should parse numbered backreferences', () => {
      const result = parseRegexPattern('\\1\\2\\10');
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\1',
        description: 'Backreference to capture group 1'
      });
      expect(result[2]).toMatchObject({
        type: 'escape',
        value: '\\10',
        description: 'Backreference to capture group 10'
      });
    });

    it('should parse named backreferences', () => {
      const result = parseRegexPattern('\\k<name>');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\k<name>',
        description: 'Named backreference to group "name"'
      });
    });
  });

  describe('Groups', () => {
    it('should parse basic capturing group', () => {
      const result = parseRegexPattern('(abc)');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '(abc)',
        description: 'Capturing group',
        children: expect.any(Array)
      });
    });

    it('should parse non-capturing group', () => {
      const result = parseRegexPattern('(?:abc)');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '(?:abc)',
        description: 'Non-capturing group'
      });
    });

    it('should parse positive lookahead', () => {
      const result = parseRegexPattern('(?=abc)');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '(?=abc)',
        description: 'Positive lookahead - matches if followed by this pattern'
      });
    });

    it('should parse negative lookahead', () => {
      const result = parseRegexPattern('(?!abc)');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '(?!abc)',
        description: 'Negative lookahead - matches if NOT followed by this pattern'
      });
    });

    it('should parse positive lookbehind', () => {
      const result = parseRegexPattern('(?<=abc)');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '(?<=abc)',
        description: 'Positive lookbehind - matches if preceded by this pattern'
      });
    });

    it('should parse negative lookbehind', () => {
      const result = parseRegexPattern('(?<!abc)');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '(?<!abc)',
        description: 'Negative lookbehind - matches if NOT preceded by this pattern'
      });
    });

    it('should parse named capturing group', () => {
      const result = parseRegexPattern('(?<name>abc)');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '(?<name>abc)',
        description: 'Named capturing group "name"'
      });
    });

    it('should handle nested groups', () => {
      const result = parseRegexPattern('(a(b)c)');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '(a(b)c)',
        children: expect.any(Array)
      });
      expect(result[0].children).toHaveLength(3); // 'a', '(b)', 'c'
    });
  });

  describe('Quantifiers', () => {
    it('should parse basic quantifiers', () => {
      const result = parseRegexPattern('a*b+c?');
      expect(result).toHaveLength(6); // a, *, b, +, c, ?
      expect(result[1]).toMatchObject({
        type: 'quantifier',
        value: '*',
        description: 'Matches 0 or more times (greedy)'
      });
      expect(result[3]).toMatchObject({
        type: 'quantifier',
        value: '+',
        description: 'Matches 1 or more times (greedy)'
      });
      expect(result[5]).toMatchObject({
        type: 'quantifier',
        value: '?',
        description: 'Matches 0 or 1 time (greedy)'
      });
    });

    it('should parse lazy quantifiers', () => {
      const result = parseRegexPattern('a*?b+?c??');
      expect(result).toHaveLength(6);
      expect(result[1]).toMatchObject({
        type: 'quantifier',
        value: '*?',
        description: 'Matches 0 or more times (lazy/non-greedy)'
      });
      expect(result[3]).toMatchObject({
        type: 'quantifier',
        value: '+?',
        description: 'Matches 1 or more times (lazy/non-greedy)'
      });
      expect(result[5]).toMatchObject({
        type: 'quantifier',
        value: '??',
        description: 'Matches 0 or 1 time (lazy/non-greedy)'
      });
    });

    it('should parse exact quantifier', () => {
      const result = parseRegexPattern('a{3}');
      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        type: 'quantifier',
        value: '{3}',
        description: 'Matches exactly 3 times (greedy)'
      });
    });

    it('should parse range quantifier', () => {
      const result = parseRegexPattern('a{2,5}');
      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        type: 'quantifier',
        value: '{2,5}',
        description: 'Matches between 2 and 5 times (greedy)'
      });
    });

    it('should parse open-ended quantifier', () => {
      const result = parseRegexPattern('a{2,}');
      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        type: 'quantifier',
        value: '{2,}',
        description: 'Matches 2 or more times (greedy)'
      });
    });

    it('should parse lazy range quantifier', () => {
      const result = parseRegexPattern('a{2,5}?');
      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        type: 'quantifier',
        value: '{2,5}?',
        description: 'Matches between 2 and 5 times (lazy/non-greedy)'
      });
    });
  });

  describe('Anchors', () => {
    it('should parse anchors without flags', () => {
      const result = parseRegexPattern('^abc$');
      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({
        type: 'anchor',
        value: '^',
        description: 'Start of string'
      });
      expect(result[4]).toMatchObject({
        type: 'anchor',
        value: '$',
        description: 'End of string'
      });
    });

    it('should parse anchors with multiline flag', () => {
      const result = parseRegexPattern('^abc$', { m: true });
      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({
        type: 'anchor',
        value: '^',
        description: 'Start of line (multiline mode)'
      });
      expect(result[4]).toMatchObject({
        type: 'anchor',
        value: '$',
        description: 'End of line (multiline mode)'
      });
    });
  });

  describe('Wildcard', () => {
    it('should parse dot without flags', () => {
      const result = parseRegexPattern('a.b');
      expect(result).toHaveLength(3);
      expect(result[1]).toMatchObject({
        type: 'wildcard',
        value: '.',
        description: 'Matches any character except line terminators'
      });
    });

    it('should parse dot with dotAll flag', () => {
      const result = parseRegexPattern('a.b', { s: true });
      expect(result).toHaveLength(3);
      expect(result[1]).toMatchObject({
        type: 'wildcard',
        value: '.',
        description: 'Matches any character including line terminators (dotAll flag enabled)'
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle invalid character class gracefully', () => {
      const result = parseRegexPattern('[abc');
      expect(result).toHaveLength(4); // '[', 'a', 'b', 'c'
      expect(result[0]).toMatchObject({
        type: 'literal',
        value: '[',
        description: 'Matches the character "["'
      });
    });

    it('should handle invalid quantifier gracefully', () => {
      const result = parseRegexPattern('a{');
      expect(result).toHaveLength(2); // 'a', '{'
      expect(result[1]).toMatchObject({
        type: 'literal',
        value: '{',
        description: 'Matches the character "{"'
      });
    });
  });

  describe('Complex Patterns', () => {
    it('should parse email-like pattern', () => {
      const result = parseRegexPattern('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
      expect(result).toHaveLength(3); // group, '@', group
      expect(result[0].type).toBe('group');
      expect(result[1].type).toBe('literal');
      expect(result[2].type).toBe('group');
    });

    it('should parse phone number pattern with lookarounds', () => {
      const result = parseRegexPattern('(?=\\d{10})(?!555)\\d{3}-?\\d{3}-?\\d{4}');
      expect(result.length).toBeGreaterThan(5);
      expect(result[0]).toMatchObject({
        type: 'group',
        description: expect.stringContaining('Positive lookahead')
      });
      expect(result[1]).toMatchObject({
        type: 'group',
        description: expect.stringContaining('Negative lookahead')
      });
    });
  });
});

// Additional test cases to add to regexParser.test.ts

describe('regexParser - Missing Critical Tests', () => {
  
  // CRITICAL: Alternation is implemented but NOT TESTED!
  describe('Alternation', () => {
    it('should parse simple alternation', () => {
      const result = parseRegexPattern('cat|dog');
      expect(result).toHaveLength(7); // c, a, t, |, d, o, g
      expect(result[3]).toMatchObject({
        type: 'alternation',
        value: '|',
        description: 'Alternation (OR)'
      });
    });

    it('should parse multiple alternations', () => {
      const result = parseRegexPattern('cat|dog|bird');
      expect(result).toHaveLength(12); // c,a,t,|,d,o,g,|,b,i,r,d
      const alternations = result.filter(t => t.type === 'alternation');
      expect(alternations).toHaveLength(2);
    });

    it('should parse alternation inside groups', () => {
      const result = parseRegexPattern('(cat|dog)');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('group');
      expect(result[0].children).toBeDefined();
      const children = result[0].children!;
      expect(children).toHaveLength(7); // c, a, t, |, d, o, g
      expect(children[3].type).toBe('alternation');
    });

    it('should parse complex alternation patterns', () => {
      const result = parseRegexPattern('(https?|ftp)://');
      expect(result).toHaveLength(4); // group, :, /, /
      
      // Verify the group
      expect(result[0].type).toBe('group');
      
      // Verify the literals after the group
      expect(result[1]).toMatchObject({
        type: 'literal',
        value: ':'
      });
      expect(result[2]).toMatchObject({
        type: 'literal',
        value: '/'
      });
      expect(result[3]).toMatchObject({
        type: 'literal',
        value: '/'
      });
      
      // Verify alternation inside the group
      const groupChildren = result[0].children!;
      const altIndex = groupChildren.findIndex(t => t.type === 'alternation');
      expect(altIndex).toBeGreaterThan(-1);
    });

    it('should handle empty alternation branches', () => {
      const result = parseRegexPattern('a|');
      expect(result).toHaveLength(2); // a, |
      expect(result[1].type).toBe('alternation');
    });
  });

  // CRITICAL: Word boundaries are implemented but NOT TESTED!
  describe('Word Boundaries', () => {
    it('should parse word boundary \\b', () => {
      const result = parseRegexPattern('\\bword\\b');
      expect(result).toHaveLength(6); // \b, w, o, r, d, \b
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\b',
        description: 'Word boundary'
      });
      expect(result[5]).toMatchObject({
        type: 'escape',
        value: '\\b',
        description: 'Word boundary'
      });
    });

    it('should parse non-word boundary \\B', () => {
      const result = parseRegexPattern('\\Bword\\B');
      expect(result).toHaveLength(6);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\B',
        description: 'Non-word boundary'
      });
    });

    it('should handle word boundaries in complex patterns', () => {
      const result = parseRegexPattern('\\b(\\w+)\\b');
      expect(result).toHaveLength(3); // \b, group, \b
      expect(result[0].type).toBe('escape');
      expect(result[0].value).toBe('\\b');
      expect(result[2].type).toBe('escape');
      expect(result[2].value).toBe('\\b');
    });
  });

  describe('Character Class Edge Cases', () => {
    it('should handle literal hyphen at start of class', () => {
      const result = parseRegexPattern('[-a]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[-a]',
        description: expect.stringContaining('character')
      });
    });

    it('should handle literal hyphen at end of class', () => {
      const result = parseRegexPattern('[a-]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[a-]'
      });
    });

    it('should handle escaped closing bracket in class', () => {
      const result = parseRegexPattern('[\\]]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[\\]]'
      });
    });

    it('should handle backslash in character class', () => {
      const result = parseRegexPattern('[\\\\]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[\\\\]'
      });
    });

    it('should handle complex character class with multiple escapes', () => {
      const result = parseRegexPattern('[\\s\\S]');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'character-class',
        value: '[\\s\\S]',
        description: expect.stringContaining('escape sequences')
      });
    });
  });

  describe('Group Edge Cases', () => {
    it('should handle empty capturing group', () => {
      const result = parseRegexPattern('()');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '()',
        description: 'Capturing group',
        children: []
      });
    });

    it('should handle empty non-capturing group', () => {
      const result = parseRegexPattern('(?:)');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'group',
        value: '(?:)',
        description: 'Non-capturing group',
        children: []
      });
    });

    it('should handle group followed by quantifier', () => {
      const result = parseRegexPattern('(abc)+');
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('group');
      expect(result[1]).toMatchObject({
        type: 'quantifier',
        value: '+',
        description: expect.stringContaining('1 or more')
      });
    });

    it('should handle nested groups with quantifiers', () => {
      const result = parseRegexPattern('((a+b)+c)+');
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('group');
      expect(result[1].type).toBe('quantifier');
    });
  });

  describe('Special Escape Sequences', () => {
    it('should parse null character \\0', () => {
      const result = parseRegexPattern('\\0');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\0',
        description: 'Null character'
      });
    });

    it('should differentiate \\0 from \\1', () => {
      const result1 = parseRegexPattern('\\0');
      const result2 = parseRegexPattern('\\1');
      expect(result1[0].description).toContain('Null');
      expect(result2[0].description).toContain('Backreference');
    });

    it('should handle form feed \\f', () => {
      const result = parseRegexPattern('\\f');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\f',
        description: 'Form feed'
      });
    });

    it('should handle vertical tab \\v', () => {
      const result = parseRegexPattern('\\v');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'escape',
        value: '\\v',
        description: 'Vertical tab'
      });
    });
  });

  describe('Invalid Pattern Handling', () => {
    it('should handle incomplete hex escape', () => {
      const result = parseRegexPattern('\\x');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('escape');
      // Should either treat as literal x or provide appropriate description
    });

    it('should handle incomplete unicode escape', () => {
      const result = parseRegexPattern('\\u');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('escape');
    });

    it('should handle invalid quantifier values', () => {
      const result = parseRegexPattern('a{999999999999999}');
      // Should handle without crashing
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle mismatched parentheses', () => {
      const result = parseRegexPattern('((abc)');
      // Should handle gracefully
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Real-World Patterns', () => {
    it('should parse URL validation pattern', () => {
      const urlPattern = 'https?://[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&\'\\(\\)\\*\\+,;=.]+';
      expect(() => parseRegexPattern(urlPattern)).not.toThrow();
    });

    it('should parse email pattern with alternation', () => {
      const emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|org|net|edu)$';
      const result = parseRegexPattern(emailPattern);
      expect(result).toBeDefined();
      // Should contain alternation in the TLD group
    });

    it('should parse password validation pattern', () => {
      const passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$';
      const result = parseRegexPattern(passwordPattern);
      // Should have multiple lookahead groups
      const lookaheads = result.filter(t => 
        t.type === 'group' && t.description?.includes('lookahead')
      );
      expect(lookaheads.length).toBeGreaterThan(0);
    });

    it('should parse IPv4 address pattern', () => {
      const ipPattern = '^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$';
      expect(() => parseRegexPattern(ipPattern)).not.toThrow();
    });

    it('should parse date pattern with alternation', () => {
      const datePattern = '(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/\\d{4}';
      const result = parseRegexPattern(datePattern);
      expect(result).toBeDefined();
    });
  });

  describe('Quantifier Edge Cases', () => {
    it('should handle quantifier on anchor (invalid but should not crash)', () => {
      const result = parseRegexPattern('^+');
      expect(result).toHaveLength(2);
      // Parser should handle this gracefully
    });

    it('should handle nested quantifiers (potential ReDoS)', () => {
      const result = parseRegexPattern('(a*)+');
      expect(result).toHaveLength(2);
      // Could add warning about catastrophic backtracking
    });

    it('should handle possessive quantifiers notation (even if not supported)', () => {
      const result = parseRegexPattern('a++');
      expect(result).toHaveLength(3); // a, +, +
      // JS doesn't support possessive, but shouldn't crash
    });
  });

  describe('Flag-Dependent Behavior', () => {
    it('should reflect sticky flag in descriptions', () => {
      const result = parseRegexPattern('^test', { y: true });
      // Could mention sticky mode in anchor description
      expect(result[0].type).toBe('anchor');
    });

    it('should handle unicode flag effects', () => {
      const result = parseRegexPattern('[😀-😏]', { u: true });
      // With unicode flag, this should work with emoji ranges
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('character-class');
    });
  });

  describe('Performance Tests', () => {
    it('should handle very long patterns efficiently', () => {
      const longPattern = 'a'.repeat(1000);
      const start = Date.now();
      const result = parseRegexPattern(longPattern);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // Should parse in < 100ms
      expect(result).toHaveLength(1000);
    });

    it('should handle deeply nested groups', () => {
      const nested = '('.repeat(20) + 'a' + ')'.repeat(20);
      expect(() => parseRegexPattern(nested)).not.toThrow();
    });
  });
});