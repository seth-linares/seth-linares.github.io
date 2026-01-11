// src/components/regex_playground/PatternLibrary.tsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ANIMATION_VARIANTS } from '@/utils/animations';
import type { PatternLibraryProps, LibraryPattern } from '@/types/regex';

// Organized pattern library with categories, examples, and test strings
const PATTERN_LIBRARY: LibraryPattern[] = [
    // Validation
    {
        id: 'email',
        name: 'Email',
        pattern: String.raw`[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`,
        category: 'validation',
        flags: { i: true },
        description: 'Matches most email addresses',
        examples: {
            matches: ['user@example.com', 'name.surname@company.co.uk'],
            doesNotMatch: ['@example.com', 'user@', 'user@.com'],
        },
        testString: 'Contact us at support@example.com or sales@company.co.uk for help.',
    },
    {
        id: 'url',
        name: 'URL (http/https)',
        pattern: String.raw`https?:\/\/[^\s/$.?#].[^\s]*`,
        category: 'validation',
        description: 'Matches web URLs starting with http or https',
        examples: {
            matches: ['https://example.com', 'http://sub.domain.org/path?query=1'],
            doesNotMatch: ['ftp://files.com', 'example.com'],
        },
        testString: 'Visit https://example.com or http://docs.site.org/guide for more info.',
    },
    {
        id: 'phone-us',
        name: 'US Phone',
        pattern: String.raw`\d{3}-\d{3}-\d{4}`,
        category: 'validation',
        description: 'Matches US phone numbers in XXX-XXX-XXXX format',
        examples: {
            matches: ['555-123-4567', '800-555-1234'],
            doesNotMatch: ['5551234567', '(555) 123-4567'],
        },
        testString: 'Call us at 555-123-4567 or toll-free 800-555-1234.',
    },
    {
        id: 'phone-intl',
        name: 'Phone (flexible)',
        pattern: String.raw`\+?[\d\s\-().]{7,}`,
        category: 'validation',
        description: 'Matches various phone formats including international',
        examples: {
            matches: ['+1 (555) 123-4567', '555.123.4567', '+44 20 7946 0958'],
            doesNotMatch: ['123', 'phone'],
        },
        testString: 'US: +1 (555) 123-4567, UK: +44 20 7946 0958, Simple: 555.123.4567',
    },
    {
        id: 'ipv4',
        name: 'IPv4 Address',
        pattern: String.raw`\b(?:\d{1,3}\.){3}\d{1,3}\b`,
        category: 'validation',
        description: 'Matches IPv4 addresses',
        examples: {
            matches: ['192.168.1.1', '10.0.0.255'],
            doesNotMatch: ['256.1.1.1', '1.2.3'],
        },
        testString: 'Server IPs: 192.168.1.1, 10.0.0.255, gateway 172.16.0.1',
    },
    {
        id: 'zip',
        name: 'US ZIP Code',
        pattern: String.raw`\b\d{5}(?:-\d{4})?\b`,
        category: 'validation',
        description: 'Matches 5-digit or 9-digit US ZIP codes',
        examples: {
            matches: ['12345', '12345-6789'],
            doesNotMatch: ['1234', '123456'],
        },
        testString: 'Ship to ZIP 90210 or 10001-1234 for faster delivery.',
    },
    {
        id: 'credit-card',
        name: 'Credit Card',
        pattern: String.raw`\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b`,
        category: 'validation',
        description: 'Matches 16-digit credit card numbers',
        examples: {
            matches: ['4111111111111111', '4111-1111-1111-1111', '4111 1111 1111 1111'],
            doesNotMatch: ['411111111111', '41111111111111111'],
        },
        testString: 'Card: 4111-1111-1111-1111 or 5500 0000 0000 0004',
    },

    // Extraction
    {
        id: 'hashtag',
        name: 'Hashtag',
        pattern: String.raw`#\w+`,
        category: 'extraction',
        description: 'Extracts hashtags from text',
        examples: {
            matches: ['#coding', '#React19', '#100DaysOfCode'],
            doesNotMatch: ['# space', 'no#middle'],
        },
        testString: 'Learning #regex today! #coding #webdev #100DaysOfCode',
    },
    {
        id: 'mention',
        name: '@Mention',
        pattern: String.raw`@[A-Za-z0-9_]+`,
        category: 'extraction',
        description: 'Extracts @mentions from social media text',
        examples: {
            matches: ['@username', '@User_123'],
            doesNotMatch: ['@ space', 'email@domain'],
        },
        testString: 'Thanks @johndoe and @jane_smith for the help! cc @dev_team',
    },
    {
        id: 'quoted',
        name: 'Quoted String',
        pattern: String.raw`"([^"\\]|\\.)*"`,
        category: 'extraction',
        description: 'Extracts double-quoted strings, handles escaped quotes',
        examples: {
            matches: ['"hello"', '"say \\"hi\\""', '"multi word"'],
            doesNotMatch: ["'single quotes'", 'no quotes'],
        },
        testString: 'He said "hello" and she replied "nice to \\"meet\\" you".',
    },
    {
        id: 'parentheses',
        name: 'Parentheses Content',
        pattern: String.raw`\([^)]+\)`,
        category: 'extraction',
        description: 'Extracts content within parentheses',
        examples: {
            matches: ['(example)', '(multiple words here)'],
            doesNotMatch: ['()', 'no parens'],
        },
        testString: 'The function call (with arguments) returned (success code).',
    },
    {
        id: 'markdown-link',
        name: 'Markdown Link',
        pattern: String.raw`\[([^\]]+)\]\(([^)]+)\)`,
        category: 'extraction',
        description: 'Extracts markdown-style links [text](url)',
        examples: {
            matches: ['[Google](https://google.com)', '[click here](./page.html)'],
            doesNotMatch: ['[broken', 'no link'],
        },
        testString: 'Check out [Google](https://google.com) and [our docs](./docs.html).',
    },

    // Formatting
    {
        id: 'date-iso',
        name: 'ISO Date',
        pattern: String.raw`\d{4}-\d{2}-\d{2}`,
        category: 'formatting',
        description: 'Matches dates in YYYY-MM-DD format',
        examples: {
            matches: ['2024-01-15', '1999-12-31'],
            doesNotMatch: ['01-15-2024', '2024/01/15'],
        },
        testString: 'Event dates: 2024-01-15, 2024-06-30, and 2025-12-31.',
    },
    {
        id: 'date-us',
        name: 'US Date (MM/DD/YYYY)',
        pattern: String.raw`\d{1,2}\/\d{1,2}\/\d{4}`,
        category: 'formatting',
        description: 'Matches dates in MM/DD/YYYY format',
        examples: {
            matches: ['01/15/2024', '12/31/1999', '1/5/2024'],
            doesNotMatch: ['2024-01-15', '15/01/2024'],
        },
        testString: 'Born on 01/15/1990, graduated 5/20/2012, married 12/31/2020.',
    },
    {
        id: 'time-24h',
        name: 'Time (24h)',
        pattern: String.raw`\b([01]?\d|2[0-3]):[0-5]\d\b`,
        category: 'formatting',
        description: 'Matches 24-hour time format HH:MM',
        examples: {
            matches: ['14:30', '09:00', '23:59'],
            doesNotMatch: ['25:00', '9:5'],
        },
        testString: 'Meeting at 09:00, lunch at 12:30, ends at 17:00.',
    },
    {
        id: 'hex-color',
        name: 'Hex Color',
        pattern: String.raw`#(?:[0-9a-fA-F]{3}){1,2}\b`,
        category: 'formatting',
        description: 'Matches CSS hex color codes',
        examples: {
            matches: ['#fff', '#FF5733', '#a1b2c3'],
            doesNotMatch: ['#gg', '#12345', 'fff'],
        },
        testString: 'Colors: #fff, #FF5733, #a1b2c3, background: #000000.',
    },
    {
        id: 'slug',
        name: 'URL Slug',
        pattern: String.raw`[a-z0-9]+(?:-[a-z0-9]+)*`,
        category: 'formatting',
        description: 'Matches URL-friendly slugs',
        examples: {
            matches: ['my-blog-post', 'article123', 'how-to-regex'],
            doesNotMatch: ['My Post', 'has spaces', 'UPPERCASE'],
        },
        testString: 'URL: /blog/my-first-post and /docs/getting-started-guide',
    },
    {
        id: 'uuid',
        name: 'UUID',
        pattern: String.raw`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`,
        category: 'formatting',
        flags: { i: true },
        description: 'Matches standard UUID format',
        examples: {
            matches: ['550e8400-e29b-41d4-a716-446655440000'],
            doesNotMatch: ['550e8400-e29b-41d4-a716', 'not-a-uuid'],
        },
        testString:
            'User ID: 550e8400-e29b-41d4-a716-446655440000, Session: a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    },

    // Misc / Common
    {
        id: 'whitespace',
        name: 'Whitespace',
        pattern: String.raw`\s+`,
        category: 'misc',
        description: 'Matches one or more whitespace characters',
        examples: {
            matches: [' ', '\\t', '\\n', '   '],
            doesNotMatch: ['a', ''],
        },
        testString: 'Multiple   spaces    and\ttabs\there.',
    },
    {
        id: 'number',
        name: 'Number',
        pattern: String.raw`-?\d+(?:\.\d+)?`,
        category: 'misc',
        description: 'Matches integers and decimals, positive or negative',
        examples: {
            matches: ['42', '-17', '3.14', '-0.5'],
            doesNotMatch: ['.5', '1,000'],
        },
        testString: 'Values: 42, -17, 3.14, -0.5, and 1000.',
    },
    {
        id: 'word',
        name: 'Word',
        pattern: String.raw`\b\w+\b`,
        category: 'misc',
        description: 'Matches whole words (letters, numbers, underscores)',
        examples: {
            matches: ['hello', 'test123', 'snake_case'],
            doesNotMatch: ['-', '!@#'],
        },
        testString: 'Each word_here gets matched, including test123!',
    },
    {
        id: 'html-tag',
        name: 'HTML Tag',
        pattern: String.raw`<\/?[A-Za-z][A-Za-z0-9]*[^>]*>`,
        category: 'misc',
        description: 'Matches HTML opening and closing tags',
        examples: {
            matches: ['<div>', '</span>', '<img src="x.jpg">'],
            doesNotMatch: ['< div>', 'div>'],
        },
        testString: '<div class="container"><p>Hello</p><img src="photo.jpg"></div>',
    },
    {
        id: 'file-extension',
        name: 'File Extension',
        pattern: String.raw`\.\w{2,4}$`,
        category: 'misc',
        description: 'Matches common file extensions at end of string',
        examples: {
            matches: ['.txt', '.html', '.js'],
            doesNotMatch: ['.a', '.toolong'],
        },
        testString: 'document.pdf\nscript.js\nstyle.css\nimage.png',
    },
    {
        id: 'camel-case',
        name: 'camelCase Word',
        pattern: String.raw`[a-z]+(?:[A-Z][a-z]+)+`,
        category: 'misc',
        description: 'Matches camelCase identifiers',
        examples: {
            matches: ['camelCase', 'getUserName', 'isValidEmail'],
            doesNotMatch: ['PascalCase', 'lowercase', 'UPPERCASE'],
        },
        testString: 'Functions: getUserName, isValidEmail, calculateTotal, sendRequest',
    },
    {
        id: 'sentence',
        name: 'Sentence',
        pattern: String.raw`[A-Z][^.!?]*[.!?]`,
        category: 'misc',
        description: 'Matches sentences starting with capital letter',
        examples: {
            matches: ['Hello world.', 'How are you?', 'Wow!'],
            doesNotMatch: ['no capital.', 'No ending'],
        },
        testString: 'This is a sentence. Is this a question? Absolutely!',
    },
];

function PatternLibrary({ onUsePattern, activePatternId }: PatternLibraryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const categories = useMemo(() => {
        const cats = ['all', ...new Set(PATTERN_LIBRARY.map((p) => p.category))];
        return cats;
    }, []);

    const filteredPatterns = useMemo(() => {
        return PATTERN_LIBRARY.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.pattern.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory]);

    return (
        <div className="card bg-linear-to-br from-base-200 to-base-300 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="card-body">
                <h2 className="card-title text-primary">Pattern Library</h2>

                {/* Search Input */}
                <div className="form-control mb-3">
                    <input
                        type="text"
                        placeholder="Search patterns..."
                        className="input input-sm input-bordered"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Category Tabs */}
                <div className="tabs tabs-boxed mb-3">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`tab tab-sm ${activeCategory === cat ? 'tab-active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Pattern Grid - FIXED ANIMATION */}
                <motion.div
                    className="space-y-2 max-h-96 overflow-y-auto"
                    key={`${activeCategory}-${searchTerm}`} // Force re-mount on filter change
                >
                    <AnimatePresence initial={false}>
                        {filteredPatterns.map((pattern) => (
                            <motion.div
                                key={pattern.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{
                                    opacity: 1,
                                    height: 'auto',
                                    transition: {
                                        opacity: { duration: 0.2 },
                                        height: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
                                    },
                                }}
                                exit={{
                                    opacity: 0,
                                    height: 0,
                                    transition: {
                                        opacity: { duration: 0.1 },
                                        height: { duration: 0.2 },
                                    },
                                }}
                                className="overflow-hidden"
                            >
                                <div
                                    className={`
                      p-3 rounded-lg border transition-all cursor-pointer w-full text-left group relative
                      ${
                          activePatternId === pattern.id
                              ? 'border-primary bg-primary/10'
                              : 'border-base-300 hover:border-primary/50 hover:bg-base-100'
                      }
                    `}
                                    onClick={() =>
                                        onUsePattern({
                                            pattern: pattern.pattern,
                                            flags: pattern.flags,
                                            testString: pattern.testString,
                                        })
                                    }
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm">
                                                {pattern.name}
                                            </div>
                                            <code className="text-xs opacity-70 font-mono block truncate">
                                                /{pattern.pattern}/
                                            </code>
                                            {pattern.description && (
                                                <div className="text-xs opacity-60 mt-1 line-clamp-1">
                                                    {pattern.description}
                                                </div>
                                            )}
                                        </div>
                                        <motion.button
                                            whileHover={ANIMATION_VARIANTS.buttonHover}
                                            whileTap={ANIMATION_VARIANTS.buttonTap}
                                            className="btn btn-xs btn-primary shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUsePattern({
                                                    pattern: pattern.pattern,
                                                    flags: pattern.flags,
                                                    testString: pattern.testString,
                                                });
                                            }}
                                        >
                                            Use
                                        </motion.button>
                                    </div>
                                    {/* Custom tooltip that appears on hover */}
                                    {pattern.examples && (
                                        <div className="absolute left-0 right-0 bottom-full mb-2 p-3 bg-base-300 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-xs pointer-events-none">
                                            <div className="font-medium mb-1">
                                                {pattern.description}
                                            </div>
                                            {pattern.examples.matches && (
                                                <div className="text-success">
                                                    <span className="opacity-70">Matches: </span>
                                                    {pattern.examples.matches
                                                        .slice(0, 2)
                                                        .join(', ')}
                                                </div>
                                            )}
                                            {pattern.examples.doesNotMatch && (
                                                <div className="text-error">
                                                    <span className="opacity-70">
                                                        Won't match:{' '}
                                                    </span>
                                                    {pattern.examples.doesNotMatch
                                                        .slice(0, 2)
                                                        .join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredPatterns.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 opacity-60"
                        >
                            No patterns found
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default PatternLibrary;
