// src/components/HomePageTools.tsx
//
// Variant B1 v2: Tools-first homepage with stronger identity.
//   - Hero: typewriter terminal that reveals identity + manifesto + projects, beside a live
//     mini regex tester. No headshot. No generic "Hi I'm Seth, I build things."
//   - Wandering brand cats roam the viewport and run from the cursor.
//   - Voice throughout is short, opinionated, dev-y. Mono accents and ASCII dividers reinforce
//     the "this person actually likes computers" feel.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { siteData } from '@/personal-site-data';
import { HiOutlineMail, HiOutlineDownload, HiOutlineSparkles, HiOutlineCode } from 'react-icons/hi';
import { FiGithub, FiLinkedin, FiArrowRight } from 'react-icons/fi';
import AnimatedCats from './AnimatedCats';
import TerminalHero from './TerminalHero';

const featuredProjects = siteData.projects.filter((p) => p.featured);
const DEFAULT_PATTERN = String.raw`\b\w+@\w+\.\w+\b`;
const DEFAULT_TEXT =
    'Reach me at sethlinares1@gmail.com or workstuffseth@gmail.com — secure, performant code is my thing.';

function highlight(
    text: string,
    pattern: string
): { parts: Array<{ s: string; m: boolean }>; error: string | null; count: number } {
    if (!pattern) return { parts: [{ s: text, m: false }], error: null, count: 0 };
    let re: RegExp;
    try {
        re = new RegExp(pattern, 'g');
    } catch (e) {
        return { parts: [{ s: text, m: false }], error: (e as Error).message, count: 0 };
    }
    const parts: Array<{ s: string; m: boolean }> = [];
    let lastIndex = 0;
    let count = 0;
    let safety = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null && safety++ < 1000) {
        if (match.index > lastIndex)
            parts.push({ s: text.slice(lastIndex, match.index), m: false });
        parts.push({ s: match[0] || '', m: true });
        count++;
        lastIndex = match.index + match[0].length;
        if (match[0].length === 0) re.lastIndex++;
    }
    if (lastIndex < text.length) parts.push({ s: text.slice(lastIndex), m: false });
    return { parts, error: null, count };
}

function AsciiDivider({ label }: { label?: string }) {
    return (
        <div className="flex items-center gap-3 text-xs font-mono text-base-content/30 uppercase tracking-widest my-8">
            <span className="flex-1 border-t border-dashed border-base-content/20" />
            {label && <span>── {label} ──</span>}
            <span className="flex-1 border-t border-dashed border-base-content/20" />
        </div>
    );
}

function HomePageTools() {
    const [pattern, setPattern] = useState(DEFAULT_PATTERN);
    const [text, setText] = useState(DEFAULT_TEXT);
    const result = highlight(text, pattern);

    const handleResumeDownload = () => {
        const link = document.createElement('a');
        link.href = '/Seth_Linares_Resume.pdf';
        link.download = 'Seth_Linares_Resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-base-100 pt-16 relative isolate">
            <AnimatedCats />

            {/* ── Hero: Hi I'm Seth + live regex ─────────────────── */}
            <section className="relative">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:py-16">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="lg:w-2/5 lg:sticky lg:top-24" data-cat-obstacle>
                            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-2">
                                ◆ try something I built ─ live
                            </p>
                            <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4">
                                Hi, I'm{' '}
                                <span className="bg-linear-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
                                    Seth
                                </span>
                                .
                            </h1>
                            <p className="text-lg text-base-content/80 leading-relaxed mb-4">
                                I build security tools, dev tooling, and IoT systems. Some of it is
                                running in this page right now — the regex tester on the right is
                                from my full{' '}
                                <Link
                                    to="/regex-playground"
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    Regex Playground
                                </Link>
                                . There's also a terminal below — give it a sec to type itself out.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleResumeDownload}
                                    className="btn btn-primary btn-sm gap-2"
                                >
                                    <HiOutlineDownload className="w-4 h-4" />
                                    Resume
                                </button>
                                <a
                                    href={siteData.contact.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-ghost btn-sm gap-2"
                                >
                                    <FiGithub className="w-4 h-4" />
                                    GitHub
                                </a>
                                <a
                                    href={`mailto:${siteData.contact.email}`}
                                    className="btn btn-ghost btn-sm gap-2"
                                >
                                    <HiOutlineMail className="w-4 h-4" />
                                    Email
                                </a>
                                <a
                                    href={siteData.contact.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-ghost btn-sm gap-2"
                                >
                                    <FiLinkedin className="w-4 h-4" />
                                    LinkedIn
                                </a>
                            </div>
                        </div>

                        <div className="lg:w-3/5 w-full">
                            <div
                                className="bg-neutral text-neutral-content rounded-xl border border-neutral-content/10 shadow-2xl overflow-hidden font-mono text-sm"
                                data-cat-obstacle
                            >
                                <div className="flex items-center gap-2 px-4 py-2 bg-neutral-content/10 border-b border-neutral-content/10">
                                    <div className="flex gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-error/80" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
                                    </div>
                                    <span className="text-xs opacity-60 ml-2">regex-mini.tsx</span>
                                    <span className="ml-auto text-xs opacity-60">
                                        {result.error
                                            ? 'invalid'
                                            : `${result.count} match${result.count === 1 ? '' : 'es'}`}
                                    </span>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <label className="text-xs opacity-60 mb-1 block">
                                            pattern
                                        </label>
                                        <div className="flex items-center bg-neutral-content/10 rounded-md">
                                            <span className="px-2 opacity-40 select-none">/</span>
                                            <input
                                                type="text"
                                                value={pattern}
                                                onChange={(e) => setPattern(e.target.value)}
                                                spellCheck={false}
                                                className="flex-1 bg-transparent py-2 outline-none"
                                            />
                                            <span className="px-2 opacity-40 select-none">/g</span>
                                        </div>
                                        {result.error && (
                                            <p className="text-xs text-error mt-1">
                                                {result.error}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs opacity-60 mb-1 block">
                                            text
                                        </label>
                                        <textarea
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            spellCheck={false}
                                            rows={3}
                                            className="w-full bg-neutral-content/10 rounded-md p-2 outline-none resize-y"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs opacity-60 mb-1 block">
                                            output
                                        </label>
                                        <div className="bg-neutral-content/10 rounded-md p-3 whitespace-pre-wrap wrap-break-word leading-relaxed min-h-12">
                                            {result.parts.map((p, i) =>
                                                p.m ? (
                                                    <mark
                                                        key={i}
                                                        className="bg-primary/40 text-neutral-content rounded px-0.5"
                                                    >
                                                        {p.s}
                                                    </mark>
                                                ) : (
                                                    <span key={i}>{p.s}</span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-base-content/60 text-center mt-3">
                                edit pattern or text — output updates live · the full playground
                                supports flags, multi-string testing, and saved patterns
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Manifesto terminal ─────────────────────────────── */}
            <section id="about" className="container mx-auto max-w-4xl px-4 relative scroll-mt-24">
                <AsciiDivider label="$ whoami" />
                <p className="text-base-content/70 mb-4 font-mono text-sm">
                    # the longer answer — auto-typing, click to skip.
                </p>
                <div data-cat-obstacle>
                    <TerminalHero />
                </div>
            </section>

            {/* ── Tools grid ─────────────────────────────────────── */}
            <section id="tools" className="container mx-auto max-w-5xl px-4 relative scroll-mt-24">
                <AsciiDivider label="tools running on this site" />
                <p className="text-base-content/70 mb-6 font-mono text-sm">
                    # built and shipped — open in a new tab and try them.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <Link
                        to="/regex-playground"
                        className="group block bg-base-200 rounded-xl p-6 border border-base-300 hover:border-primary hover:shadow-lg transition-all relative overflow-hidden"
                        data-cat-obstacle
                    >
                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-success/20 text-success text-[10px] font-mono uppercase rounded-bl">
                            live
                        </div>
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <HiOutlineCode className="w-6 h-6 text-primary" />
                            </div>
                            <FiArrowRight className="w-5 h-5 text-base-content/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                            Regex Playground
                        </h3>
                        <p className="text-base-content/70 text-sm">
                            Real-time matching, flags, multi-string testing, pattern library.
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {['React', 'TypeScript', 'Tailwind'].map((t) => (
                                <span key={t} className="badge badge-xs badge-outline font-mono">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </Link>

                    <Link
                        to="/prompt-generator"
                        className="group block bg-base-200 rounded-xl p-6 border border-base-300 hover:border-primary hover:shadow-lg transition-all relative overflow-hidden"
                        data-cat-obstacle
                    >
                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-success/20 text-success text-[10px] font-mono uppercase rounded-bl">
                            live
                        </div>
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <HiOutlineSparkles className="w-6 h-6 text-primary" />
                            </div>
                            <FiArrowRight className="w-5 h-5 text-base-content/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                            Prompt Builder
                        </h3>
                        <p className="text-base-content/70 text-sm">
                            Compose prompts from files + text. Optional Anthropic token counting.
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {['React', 'TypeScript', 'Anthropic SDK'].map((t) => (
                                <span key={t} className="badge badge-xs badge-outline font-mono">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </Link>
                </div>
            </section>

            {/* ── Featured projects ─────────────────────────────── */}
            <section
                id="projects"
                className="container mx-auto max-w-5xl px-4 relative scroll-mt-24"
            >
                <AsciiDivider label="selected projects" />
                <p className="text-base-content/70 mb-6 font-mono text-sm">
                    # the ones I'd actually want to talk about in an interview.
                </p>
                <div className="space-y-8">
                    {featuredProjects.map((p) => (
                        <article
                            key={p.id}
                            className="border-l-4 border-primary pl-6 py-1"
                            data-cat-obstacle
                        >
                            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                                <div>
                                    <h3 className="text-xl font-bold">{p.title}</h3>
                                    <p className="text-primary text-sm font-mono">{p.subtitle}</p>
                                </div>
                                {p.links.github && (
                                    <a
                                        href={p.links.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm hover:text-primary inline-flex items-center gap-1.5"
                                    >
                                        <FiGithub className="w-4 h-4" />
                                        Source
                                    </a>
                                )}
                            </div>
                            <p className="text-base-content/85 mb-3">{p.description}</p>
                            <ul className="space-y-1 text-sm text-base-content/75">
                                {p.highlights.slice(0, 3).map((h) => (
                                    <li key={h} className="flex gap-2">
                                        <span className="text-primary mt-1.5">▸</span>
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {p.technologies.map((t) => (
                                    <span key={t} className="badge badge-sm badge-ghost font-mono">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* ── Footer-style contact ──────────────────────────── */}
            <section
                id="contact"
                className="container mx-auto max-w-5xl px-4 pb-16 relative scroll-mt-24"
            >
                <AsciiDivider label="end of page" />
                <div className="text-center" data-cat-obstacle>
                    <p className="font-mono text-sm text-base-content/60 mb-2">
                        # ↓ if you read this far, send a note.
                    </p>
                    <h2 className="text-2xl font-bold mb-4">Want to work together?</h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        <a
                            href={`mailto:${siteData.contact.email}`}
                            className="btn btn-primary gap-2"
                        >
                            <HiOutlineMail className="w-4 h-4" />
                            {siteData.contact.email}
                        </a>
                        <a
                            href={siteData.contact.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost gap-2"
                        >
                            <FiLinkedin className="w-4 h-4" />
                            LinkedIn
                        </a>
                        <a
                            href={siteData.contact.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost gap-2"
                        >
                            <FiGithub className="w-4 h-4" />
                            GitHub
                        </a>
                    </div>
                    <p className="font-mono text-xs text-base-content/40 mt-8">
                        ── move cursor to scare them · drag one from the tray to spawn · the cats
                        are not part of the rendering pipeline ──
                    </p>
                </div>
            </section>
        </div>
    );
}

export default HomePageTools;
