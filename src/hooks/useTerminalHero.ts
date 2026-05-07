// src/hooks/useTerminalHero.ts
//
// Two-phase terminal: scripted autoplay intro → live command shell. The hook owns all
// state, command parsing, history, and tab completion; the component is JSX only.

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { siteData } from '@/personal-site-data';
import { terminalData } from '@/terminal-data';

export type TerminalLine =
    | { kind: 'cmd'; text: string }
    | { kind: 'out'; text: string; cls?: string }
    | { kind: 'blank' };

export type TerminalPhase = 'autoplay' | 'interactive';

const CHAR_DELAY_CMD = 32;
const PAUSE_AFTER_CMD = 220;
const PAUSE_AFTER_OUT = 80;

const THEMES = [
    'acid',
    'aqua',
    'autumn',
    'black',
    'bumblebee',
    'business',
    'cmyk',
    'coffee',
    'corporate',
    'cupcake',
    'cyberpunk',
    'dark',
    'dim',
    'dracula',
    'emerald',
    'fantasy',
    'forest',
    'garden',
    'halloween',
    'lemonade',
    'light',
    'lofi',
    'luxury',
    'night',
    'nord',
    'pastel',
    'retro',
    'sunset',
    'sweetandmore',
    'synthwave',
    'valentine',
    'winter',
    'wireframe',
] as const;

const ROUTES: Record<string, string> = {
    home: '/',
    resume: '/resume',
    regex: '/regex-playground',
    'regex-playground': '/regex-playground',
    prompt: '/prompt-generator',
    'prompt-generator': '/prompt-generator',
    legacy: '/legacy',
};

// Files come from two sources:
//   1. terminalData.files — static copy (manifesto, now, .bashrc) the user edits directly
//   2. siteData — derived (about, contact, skills, experience, education)
// Both are merged into one lookup so `cat <name>` and Tab completion don't care about origin.
const FILES: Record<string, () => TerminalLine[]> = {
    ...Object.fromEntries(
        Object.entries(terminalData.files).map(([name, file]) => [
            name,
            (): TerminalLine[] => {
                const out: TerminalLine[] = [];
                if (file.preface) {
                    out.push({ kind: 'out', text: file.preface.text, cls: file.preface.cls });
                }
                for (const line of file.lines) {
                    out.push({ kind: 'out', text: line, cls: file.cls });
                }
                return out;
            },
        ])
    ),
    'about.txt': () => [
        { kind: 'out', text: siteData.about.summary, cls: 'text-base-content' },
        { kind: 'blank' },
        ...siteData.about.highlights.map(
            (h): TerminalLine => ({ kind: 'out', text: '▸ ' + h, cls: 'text-base-content/80' })
        ),
    ],
    'contact.txt': () => [
        { kind: 'out', text: 'email     ' + siteData.contact.email, cls: 'text-info' },
        { kind: 'out', text: 'phone     ' + siteData.contact.phone, cls: 'text-info' },
        { kind: 'out', text: 'github    ' + siteData.contact.github, cls: 'text-info' },
        { kind: 'out', text: 'linkedin  ' + siteData.contact.linkedin, cls: 'text-info' },
    ],
    'skills.txt': () =>
        siteData.skills.categories.flatMap((cat): TerminalLine[] => [
            { kind: 'out', text: '## ' + cat.name, cls: 'text-success' },
            { kind: 'out', text: cat.skills.join(' · '), cls: 'text-base-content/80' },
            { kind: 'blank' },
        ]),
    'experience.txt': () =>
        siteData.experience.flatMap((exp): TerminalLine[] => [
            {
                kind: 'out',
                text: exp.position + ' @ ' + exp.company + '  ·  ' + exp.duration,
                cls: 'text-success',
            },
            ...exp.achievements.map(
                (a): TerminalLine => ({ kind: 'out', text: '• ' + a, cls: 'text-base-content/80' })
            ),
            { kind: 'blank' },
        ]),
    'education.txt': () =>
        siteData.education.flatMap((ed): TerminalLine[] => [
            { kind: 'out', text: ed.degree, cls: 'text-success' },
            {
                kind: 'out',
                text: ed.institution + '  ·  GPA ' + ed.gpa + '  ·  ' + ed.duration,
                cls: 'text-base-content/80',
            },
            { kind: 'blank' },
        ]),
};

const isHiddenFile = (name: string) => name.startsWith('.');
const visibleFiles = () =>
    Object.keys(FILES)
        .filter((f) => !isHiddenFile(f))
        .sort();
const allFiles = () => Object.keys(FILES).sort();

const COMMANDS = [
    'help',
    'man',
    'whoami',
    'ls',
    'projects',
    'cat',
    'grep',
    'regex',
    'open',
    'theme',
    'echo',
    'date',
    'history',
    'clear',
    'pwd',
    'cd',
    'sudo',
    'vim',
    'nano',
    'rm',
    'exit',
    'quit',
];

function tokenize(input: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < input.length; i++) {
        const c = input[i];
        if (c === '"') {
            inQuote = !inQuote;
            continue;
        }
        if (!inQuote && /\s/.test(c)) {
            if (cur.length) {
                out.push(cur);
                cur = '';
            }
            continue;
        }
        cur += c;
    }
    if (cur.length) out.push(cur);
    return out;
}

interface UseTerminalHero {
    rendered: TerminalLine[];
    typingText: string;
    inputValue: string;
    cursorPos: number;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    phase: TerminalPhase;
    onSkip: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputRef: RefObject<HTMLInputElement | null>;
    focusInput: () => void;
}

export default function useTerminalHero(): UseTerminalHero {
    const [rendered, setRendered] = useState<TerminalLine[]>([]);
    const [typingText, setTypingText] = useState('');
    const [phase, setPhase] = useState<TerminalPhase>('autoplay');
    const [inputValue, setInputValue] = useState('');
    const [cursorPos, setCursorPos] = useState(0);
    const [history, setHistory] = useState<string[]>([]);
    const historyCursorRef = useRef<number | null>(null);
    const skipRef = useRef(false);
    const startedRef = useRef(false);
    const pendingCaretRef = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    // Bridge for the autoplay (one-shot, fires before exec is defined). Set in an effect below.
    const execRef = useRef<(raw: string) => TerminalLine[]>(() => []);
    const navigate = useNavigate();

    const setInputAndCaret = (value: string, caret?: number) => {
        const pos = caret ?? value.length;
        setInputValue(value);
        setCursorPos(pos);
        pendingCaretRef.current = pos;
    };

    useEffect(() => {
        // After programmatic value changes (history, Tab, Ctrl+C), force the native input's
        // caret to match cursorPos so the next user keystroke happens at the right spot.
        if (pendingCaretRef.current === null) return;
        const pos = pendingCaretRef.current;
        pendingCaretRef.current = null;
        const el = inputRef.current;
        if (el && document.activeElement === el) {
            try {
                el.setSelectionRange(pos, pos);
            } catch {
                // some inputs (e.g. type=number) reject setSelectionRange — ignore
            }
        }
    }, [inputValue]);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        const pos = e.target.selectionStart ?? v.length;
        setInputValue(v);
        setCursorPos(pos);
    };

    useEffect(() => {
        // selectionchange fires for every caret move (arrow keys including repeat, Home/End,
        // mouse, programmatic). onSelect only fires when a real selection exists, and onKeyUp
        // doesn't fire during key repeat — both feel laggy. selectionchange is the right hook.
        const handler = () => {
            const el = inputRef.current;
            if (!el || document.activeElement !== el) return;
            setCursorPos(el.selectionStart ?? el.value.length);
        };
        document.addEventListener('selectionchange', handler);
        return () => document.removeEventListener('selectionchange', handler);
    }, []);

    useEffect(() => {
        // StrictMode double-mounts the effect in dev. Guard with a ref so the autoplay
        // runs exactly once per real mount; the cleanup intentionally does nothing.
        if (startedRef.current) return;
        startedRef.current = true;
        skipRef.current = false;

        const sleep = (ms: number) =>
            new Promise<void>((res) => {
                if (skipRef.current) return res();
                const start = performance.now();
                const id: ReturnType<typeof setInterval> = setInterval(() => {
                    if (skipRef.current || performance.now() - start >= ms) {
                        clearInterval(id);
                        res();
                    }
                }, 30);
            });

        (async () => {
            const sequence = terminalData.autoplay;
            for (let i = 0; i < sequence.length; i++) {
                const cmd = sequence[i];
                const isLast = i === sequence.length - 1;

                if (skipRef.current) {
                    setRendered((prev) => [...prev, { kind: 'cmd', text: cmd }]);
                    const out = execRef.current(cmd);
                    if (out.length) setRendered((prev) => [...prev, ...out]);
                    if (!isLast) setRendered((prev) => [...prev, { kind: 'blank' }]);
                    continue;
                }

                for (let j = 1; j <= cmd.length; j++) {
                    if (skipRef.current) break;
                    setTypingText(cmd.slice(0, j));
                    await sleep(CHAR_DELAY_CMD + Math.random() * 30);
                }
                setTypingText('');
                setRendered((prev) => [...prev, { kind: 'cmd', text: cmd }]);
                await sleep(PAUSE_AFTER_CMD);

                const out = execRef.current(cmd);
                for (const line of out) {
                    setRendered((prev) => [...prev, line]);
                    if (!skipRef.current) await sleep(PAUSE_AFTER_OUT);
                }

                if (!isLast) {
                    setRendered((prev) => [...prev, { kind: 'blank' }]);
                    if (!skipRef.current) await sleep(60);
                }
            }
            setRendered((prev) => [
                ...prev,
                { kind: 'blank' },
                {
                    kind: 'out',
                    text: "# type 'help' for commands  ·  click anywhere here to focus",
                    cls: 'text-base-content/40',
                },
            ]);
            setPhase('interactive');
        })();
    }, []);

    const onSkip = () => {
        if (phase !== 'autoplay') return;
        skipRef.current = true;
    };

    const focusInput = () => {
        inputRef.current?.focus({ preventScroll: true });
    };

    const exec = (raw: string): TerminalLine[] => {
        const trimmed = raw.trim();
        if (!trimmed) return [];
        const tokens = tokenize(trimmed);
        const cmd = (tokens[0] ?? '').toLowerCase();
        const args = tokens.slice(1);

        switch (cmd) {
            case 'help':
            case 'man':
                return [
                    { kind: 'out', text: 'COMMANDS', cls: 'text-success' },
                    {
                        kind: 'out',
                        text: '  help / man                   show this help',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  whoami                       print user info',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  pwd                          print working directory',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  ls [-a]                      list files (-a includes hidden)',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  cat <file>                   print file (try `cat about.txt`)',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  projects [--shipped|--side]  list portfolio projects',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  grep <pat> [text]            match pattern against optional text (alias: regex)',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  cd <route>                   home · resume · regex · prompt · legacy (alias: open)',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  theme <name>                 set theme (try `theme list`)',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  echo <args>                  echo back',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  date                         print current date',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  history                      show recent commands',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  clear                        clear screen',
                        cls: 'text-base-content/80',
                    },
                    { kind: 'blank' },
                    { kind: 'out', text: 'KEYS', cls: 'text-success' },
                    {
                        kind: 'out',
                        text: '  ↑/↓     history       Tab     autocomplete',
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  Ctrl+L  clear screen  Ctrl+C  cancel current line',
                        cls: 'text-base-content/80',
                    },
                    { kind: 'blank' },
                    { kind: 'out', text: 'FILES', cls: 'text-success' },
                    {
                        kind: 'out',
                        text: '  ' + visibleFiles().join('  '),
                        cls: 'text-base-content/80',
                    },
                    {
                        kind: 'out',
                        text: '  (use `ls -a` to see hidden files)',
                        cls: 'text-base-content/60',
                    },
                ];
            case 'whoami':
                return [
                    {
                        kind: 'out',
                        text: `${terminalData.promptUser} — ${terminalData.tagline}`,
                        cls: 'text-base-content',
                    },
                    {
                        kind: 'out',
                        text: `currently: ${terminalData.currently}`,
                        cls: 'text-base-content/70',
                    },
                ];
            case 'ls': {
                const showAll = args.includes('-a') || args.includes('--all');
                const files = showAll ? allFiles() : visibleFiles();
                if (files.length === 0)
                    return [{ kind: 'out', text: '', cls: 'text-base-content/60' }];
                return [{ kind: 'out', text: files.join('  '), cls: 'text-success' }];
            }
            case 'projects': {
                const shippedOnly = args.includes('--shipped') || args.includes('-s');
                const sideOnly = args.includes('--side');
                const filtered = shippedOnly
                    ? siteData.projects.filter((p) => p.featured)
                    : sideOnly
                      ? siteData.projects.filter((p) => !p.featured)
                      : siteData.projects;
                const items = filtered.map((p) => {
                    if (shippedOnly) {
                        const tech = p.technologies.slice(0, 2).join(' + ');
                        return `${p.title.padEnd(12)} ${p.subtitle} · ${tech}`;
                    }
                    const tag = p.featured ? 'shipped' : '   side';
                    return `${tag}  ${p.title.padEnd(12)} ${p.subtitle}`;
                });
                return items.map(
                    (t): TerminalLine => ({ kind: 'out', text: t, cls: 'text-success' })
                );
            }
            case 'cat': {
                if (!args[0])
                    return [{ kind: 'out', text: 'cat: usage: cat <file>', cls: 'text-error' }];
                const fn = FILES[args[0]];
                if (!fn)
                    return [
                        {
                            kind: 'out',
                            text: `cat: ${args[0]}: No such file or directory`,
                            cls: 'text-error',
                        },
                        {
                            kind: 'out',
                            text: `      try \`ls\` to see available files`,
                            cls: 'text-base-content/60',
                        },
                    ];
                return fn();
            }
            case 'grep':
            case 'regex': {
                if (!args[0])
                    return [
                        {
                            kind: 'out',
                            text: `${cmd}: usage: ${cmd} <pattern> [text]`,
                            cls: 'text-error',
                        },
                    ];
                const pattern = args[0];
                const text =
                    args[1] ??
                    'Reach me at sethlinares1@gmail.com or workstuffseth@gmail.com — secure, performant code.';
                let re: RegExp;
                try {
                    re = new RegExp(pattern, 'g');
                } catch (e) {
                    return [
                        {
                            kind: 'out',
                            text: `${cmd}: invalid pattern: ${(e as Error).message}`,
                            cls: 'text-error',
                        },
                    ];
                }
                const matches: Array<{ str: string; start: number; end: number }> = [];
                let m: RegExpExecArray | null;
                let safety = 0;
                while ((m = re.exec(text)) !== null && safety++ < 1000) {
                    matches.push({ str: m[0], start: m.index, end: m.index + m[0].length });
                    if (m[0].length === 0) re.lastIndex++;
                }
                const lines: TerminalLine[] = [
                    {
                        kind: 'out',
                        text: `pattern: /${pattern}/g`,
                        cls: 'text-base-content/60',
                    },
                    { kind: 'out', text: `text:    ${text}`, cls: 'text-base-content/60' },
                    {
                        kind: 'out',
                        text: `${matches.length} match${matches.length === 1 ? '' : 'es'}`,
                        cls: matches.length ? 'text-success' : 'text-base-content/60',
                    },
                ];
                matches.forEach((mt, i) => {
                    lines.push({
                        kind: 'out',
                        text: `  [${i}] "${mt.str}"  @${mt.start}-${mt.end}`,
                        cls: 'text-info',
                    });
                });
                if (matches.length === 0) {
                    lines.push({
                        kind: 'out',
                        text: '  (try `cd regex` for the full UI with flags + multi-string testing)',
                        cls: 'text-base-content/60',
                    });
                }
                return lines;
            }
            case 'cd':
            case 'open': {
                if (!args[0])
                    return [
                        {
                            kind: 'out',
                            text:
                                `${cmd}: missing route. options: ` + Object.keys(ROUTES).join(', '),
                            cls: 'text-error',
                        },
                    ];
                const target = ROUTES[args[0].toLowerCase()];
                if (!target)
                    return [
                        {
                            kind: 'out',
                            text: `${cmd}: unknown route: ${args[0]}`,
                            cls: 'text-error',
                        },
                    ];
                setTimeout(() => navigate(target), 250);
                return [
                    { kind: 'out', text: `→ navigating to ${target} ...`, cls: 'text-success' },
                ];
            }
            case 'theme': {
                if (!args[0] || args[0] === 'list') {
                    const cur = document.body.getAttribute('data-theme') ?? '?';
                    return [
                        { kind: 'out', text: `current: ${cur}`, cls: 'text-success' },
                        { kind: 'out', text: 'available:', cls: 'text-base-content/60' },
                        {
                            kind: 'out',
                            text: '  ' + THEMES.join(' · '),
                            cls: 'text-base-content/80',
                        },
                    ];
                }
                const name = args[0].toLowerCase();
                if (!THEMES.includes(name as (typeof THEMES)[number])) {
                    return [
                        {
                            kind: 'out',
                            text: `theme: unknown theme "${args[0]}". try \`theme list\``,
                            cls: 'text-error',
                        },
                    ];
                }
                document.body.setAttribute('data-theme', name);
                localStorage.setItem('theme', name);
                return [{ kind: 'out', text: `→ theme set to ${name}`, cls: 'text-success' }];
            }
            case 'echo':
                return [{ kind: 'out', text: args.join(' '), cls: 'text-base-content' }];
            case 'date':
                return [{ kind: 'out', text: new Date().toString(), cls: 'text-base-content/80' }];
            case 'history':
                if (history.length === 0)
                    return [
                        {
                            kind: 'out',
                            text: '  (no history yet)',
                            cls: 'text-base-content/60',
                        },
                    ];
                return history.slice(-20).map(
                    (h, i): TerminalLine => ({
                        kind: 'out',
                        text: `  ${(i + 1).toString().padStart(3, ' ')}  ${h}`,
                        cls: 'text-base-content/80',
                    })
                );
            case 'pwd':
                return [{ kind: 'out', text: '/home/seth/portfolio', cls: 'text-base-content/80' }];
            case 'sudo':
                return [
                    {
                        kind: 'out',
                        text: '[sudo] password for seth: ',
                        cls: 'text-base-content/60',
                    },
                    {
                        kind: 'out',
                        text: 'seth is not in the sudoers file.  This incident will be reported.',
                        cls: 'text-error',
                    },
                ];
            case 'vim':
            case 'nano':
            case 'emacs':
                return [
                    {
                        kind: 'out',
                        text: `${cmd}: no editors here. cat is enough — you brought this on yourself.`,
                        cls: 'text-warning',
                    },
                ];
            case 'rm':
                return [{ kind: 'out', text: 'rm: nice try.', cls: 'text-error' }];
            case 'exit':
            case 'quit':
            case 'logout':
                return [
                    {
                        kind: 'out',
                        text: "you can't leave that easily. (close the tab if you must.)",
                        cls: 'text-warning',
                    },
                ];
            default:
                return [
                    {
                        kind: 'out',
                        text: `${cmd}: command not found. try \`help\`.`,
                        cls: 'text-error',
                    },
                ];
        }
    };

    // Keep execRef pointing at the latest exec so the one-shot autoplay loop (started before
    // exec exists) can run real commands when it reaches the output stage.
    useEffect(() => {
        execRef.current = exec;
    });

    const completeInput = (value: string): string => {
        const left = value.replace(/^\s+/, '');
        if (!left.includes(' ')) {
            const matches = COMMANDS.filter((c) => c.startsWith(left));
            if (matches.length === 1) return matches[0] + ' ';
            if (matches.length > 1) {
                const common = longestCommonPrefix(matches);
                if (common.length > left.length) return common;
            }
            return value;
        }
        const parts = left.split(/\s+/);
        const cmd = parts[0];
        const last = parts[parts.length - 1] ?? '';
        let pool: string[] = [];
        if (cmd === 'cat') pool = allFiles();
        else if (cmd === 'ls') pool = last.startsWith('-') ? ['-a', '--all'] : [];
        else if (cmd === 'projects')
            pool = last.startsWith('-') ? ['--shipped', '--side', '-s'] : [];
        else if (cmd === 'cd' || cmd === 'open') pool = Object.keys(ROUTES);
        else if (cmd === 'theme') pool = ['list', ...THEMES];
        const matches = pool.filter((s) => s.startsWith(last));
        if (matches.length === 0) return value;
        const head = left.slice(0, left.length - last.length);
        if (matches.length === 1) return head + matches[0];
        const common = longestCommonPrefix(matches);
        if (common.length > last.length) return head + common;
        return value;
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (phase !== 'interactive') return;

        if (e.ctrlKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            setRendered([]);
            return;
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            setRendered((prev) => [...prev, { kind: 'cmd', text: inputValue + '^C' }]);
            setInputAndCaret('');
            historyCursorRef.current = null;
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const raw = inputValue;
            const trimmed = raw.trim();
            if (trimmed === 'clear') {
                setRendered([]);
                setHistory((h) => [...h, raw]);
                setInputAndCaret('');
                historyCursorRef.current = null;
                return;
            }
            const out = exec(raw);
            setRendered((prev) => [...prev, { kind: 'cmd', text: raw }, ...out]);
            if (trimmed) setHistory((h) => [...h, raw]);
            setInputAndCaret('');
            historyCursorRef.current = null;
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length === 0) return;
            const cur = historyCursorRef.current ?? history.length;
            const next = Math.max(0, cur - 1);
            historyCursorRef.current = next;
            setInputAndCaret(history[next] ?? '');
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (history.length === 0) return;
            const cur = historyCursorRef.current;
            if (cur === null) return;
            const next = cur + 1;
            if (next >= history.length) {
                historyCursorRef.current = null;
                setInputAndCaret('');
            } else {
                historyCursorRef.current = next;
                setInputAndCaret(history[next] ?? '');
            }
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            setInputAndCaret(completeInput(inputValue));
            return;
        }
    };

    return {
        rendered,
        typingText,
        inputValue,
        cursorPos,
        onInputChange,
        phase,
        onSkip,
        onKeyDown,
        inputRef,
        focusInput,
    };
}

function longestCommonPrefix(strs: string[]): string {
    if (strs.length === 0) return '';
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) !== 0) {
            prefix = prefix.slice(0, -1);
            if (!prefix) return '';
        }
    }
    return prefix;
}
