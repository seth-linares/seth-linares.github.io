// src/terminal-data.ts
//
// Editable copy for the interactive terminal hero. Edit this file to change:
//   • the punchy whoami tagline / "currently:" line
//   • manifesto / now / ~/.bashrc contents (`cat <name>`)
//   • the autoplay command sequence
//
// Project list, contact info, skills, experience, and education are pulled live from
// personal-site-data.ts — keep that file as the source of truth and the terminal will
// reflect changes automatically (`ls`, `cat about.txt`, `cat experience.txt`, etc.).

export type TerminalFile = {
    cls: string;
    preface?: { cls: string; text: string };
    lines: string[];
};

export interface TerminalData {
    promptUser: string;
    promptHost: string;
    tagline: string;
    currently: string;
    autoplay: string[];
    files: Record<string, TerminalFile>;
}

export const terminalData: TerminalData = {
    promptUser: 'seth',
    promptHost: 'portfolio',

    tagline: 'software engineer · security & systems',
    currently: 'IoT @ Assured Automation · NJ',

    // Each command runs through the live shell during autoplay; a blank line is
    // inserted between commands. Avoid side-effecting commands here (cd / open /
    // theme / clear / history) — they'll execute for real if you list them.
    autoplay: ['whoami', 'cat manifesto.txt', 'projects --shipped', 'cat now.txt'],

    // Files served by `cat <name>`. Add or remove entries freely; the help screen
    // and Tab completion pick them up automatically.
    files: {
        'manifesto.txt': {
            cls: 'text-warning',
            lines: [
                '> Most software treats security as a checkbox. I treat it as the spec.',
                '> Performance is a UX feature, not a backend concern.',
                "> If a tool I'd want doesn't exist, I'll build it.",
            ],
        },
        'now.txt': {
            cls: 'text-info',
            lines: [
                '· building: low-level cryptography in Rust',
                '· reading: hands-on with vision transformers',
                '· hiring? security / Rust / systems roles welcome',
            ],
        },
        '.bashrc': {
            cls: 'text-base-content/80',
            preface: {
                cls: 'text-base-content/60',
                text: '# this is a portfolio, not a real shell. but here are aliases I would set:',
            },
            lines: [
                'alias ll="ls -lah"',
                'alias gs="git status -sb"',
                'alias dr="docker compose run --rm"',
                'alias k="kubectl"',
            ],
        },
    },
};
