// src/components/HomePageResume.tsx
//
// Variant A1: Two-column CV layout. Sticky sidebar (identity + contact + skills + education),
// main column (pitch + experience with metrics + featured projects + tools).
// Print-friendly: sidebar collapses above main on small screens / print.

import { Link } from 'react-router-dom';
import { siteData } from '@/personal-site-data';
import { HiOutlineMail, HiOutlinePhone, HiOutlineDownload } from 'react-icons/hi';
import { FiGithub, FiLinkedin, FiExternalLink } from 'react-icons/fi';

const featuredProjects = siteData.projects.filter((p) => p.featured);
const otherProjects = siteData.projects.filter((p) => !p.featured);

function HomePageResume() {
    const handleResumeDownload = () => {
        const link = document.createElement('a');
        link.href = '/Seth_Linares_Resume.pdf';
        link.download = 'Seth_Linares_Resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-base-100 pt-20">
            <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8 lg:py-12">
                <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-12">
                    {/* ── Sidebar ─────────────────────────────────────── */}
                    <aside className="lg:sticky lg:top-24 lg:self-start space-y-8 mb-12 lg:mb-0">
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                            <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-lg ring-2 ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden mb-4">
                                <img
                                    src="/Seth-Linares-Picture-Headshot.jpeg"
                                    alt={siteData.hero.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {siteData.hero.name}
                            </h1>
                            <p className="text-primary font-medium mt-1">{siteData.hero.title}</p>
                        </div>

                        <button
                            onClick={handleResumeDownload}
                            className="btn btn-primary btn-block btn-sm gap-2"
                        >
                            <HiOutlineDownload className="w-4 h-4" />
                            Download PDF
                        </button>

                        {/* Contact */}
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-3 pb-2 border-b border-base-300">
                                Contact
                            </h2>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <HiOutlineMail className="w-4 h-4 text-base-content/60 shrink-0" />
                                    <a
                                        href={`mailto:${siteData.contact.email}`}
                                        className="hover:text-primary truncate"
                                    >
                                        {siteData.contact.email}
                                    </a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <HiOutlinePhone className="w-4 h-4 text-base-content/60 shrink-0" />
                                    <a
                                        href={`tel:${siteData.contact.phone}`}
                                        className="hover:text-primary"
                                    >
                                        {siteData.contact.phone}
                                    </a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiGithub className="w-4 h-4 text-base-content/60 shrink-0" />
                                    <a
                                        href={siteData.contact.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary"
                                    >
                                        seth-linares
                                    </a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <FiLinkedin className="w-4 h-4 text-base-content/60 shrink-0" />
                                    <a
                                        href={siteData.contact.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary"
                                    >
                                        seth-linares
                                    </a>
                                </li>
                            </ul>
                        </section>

                        {/* Skills */}
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-3 pb-2 border-b border-base-300">
                                Skills
                            </h2>
                            <div className="space-y-3">
                                {siteData.skills.categories.map((cat) => (
                                    <div key={cat.name}>
                                        <h3 className="text-xs font-semibold text-base-content/80 mb-1">
                                            {cat.name}
                                        </h3>
                                        <p className="text-sm text-base-content/70 leading-relaxed">
                                            {cat.skills.join(' · ')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Education */}
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-3 pb-2 border-b border-base-300">
                                Education
                            </h2>
                            <div className="space-y-4">
                                {siteData.education.map((ed) => (
                                    <div key={ed.institution}>
                                        <h3 className="font-semibold text-sm">{ed.degree}</h3>
                                        <p className="text-sm text-base-content/80">
                                            {ed.institution}
                                        </p>
                                        <p className="text-xs text-base-content/60 mt-0.5">
                                            {ed.duration} · GPA {ed.gpa}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>

                    {/* ── Main column ─────────────────────────────────── */}
                    <main className="space-y-12">
                        {/* Pitch */}
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-3">
                                About
                            </h2>
                            <p className="text-lg leading-relaxed text-base-content/90">
                                {siteData.about.summary}
                            </p>
                            <ul className="mt-4 space-y-1.5 text-sm text-base-content/80">
                                {siteData.about.highlights.map((h) => (
                                    <li key={h} className="flex gap-2">
                                        <span className="text-primary mt-1.5">▸</span>
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Experience */}
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-4 pb-2 border-b border-base-300">
                                Experience
                            </h2>
                            <div className="space-y-8">
                                {siteData.experience.map((exp) => (
                                    <article key={exp.company}>
                                        <header className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                                            <div>
                                                <h3 className="text-lg font-bold">
                                                    {exp.position}
                                                </h3>
                                                <p className="text-primary font-medium">
                                                    {exp.company}
                                                </p>
                                            </div>
                                            <div className="text-sm text-base-content/60 text-right">
                                                <div>{exp.duration}</div>
                                                <div className="text-xs">{exp.location}</div>
                                            </div>
                                        </header>
                                        <ul className="mt-3 space-y-1.5 text-sm text-base-content/85">
                                            {exp.achievements.map((a) => (
                                                <li key={a} className="flex gap-2">
                                                    <span className="text-primary mt-1.5">•</span>
                                                    <span>{a}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {exp.technologies.map((t) => (
                                                <span
                                                    key={t}
                                                    className="badge badge-sm badge-ghost font-mono"
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        {/* Featured Projects */}
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-4 pb-2 border-b border-base-300">
                                Featured Projects
                            </h2>
                            <div className="space-y-6">
                                {featuredProjects.map((p) => (
                                    <article key={p.id}>
                                        <header className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                                            <div>
                                                <h3 className="text-lg font-bold">{p.title}</h3>
                                                <p className="text-primary text-sm">{p.subtitle}</p>
                                            </div>
                                            {p.links.github && (
                                                <a
                                                    href={p.links.github}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-base-content/70 hover:text-primary inline-flex items-center gap-1"
                                                >
                                                    <FiGithub className="w-3.5 h-3.5" />
                                                    GitHub
                                                    <FiExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </header>
                                        <p className="text-sm text-base-content/80 mt-1">
                                            {p.description}
                                        </p>
                                        <ul className="mt-2 space-y-1 text-sm text-base-content/75">
                                            {p.highlights.slice(0, 3).map((h) => (
                                                <li key={h} className="flex gap-2">
                                                    <span className="text-primary mt-1.5">•</span>
                                                    <span>{h}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {p.technologies.map((t) => (
                                                <span
                                                    key={t}
                                                    className="badge badge-xs badge-outline font-mono"
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        {/* Other Projects (compact) */}
                        {otherProjects.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-4 pb-2 border-b border-base-300">
                                    Other Work
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {otherProjects.map((p) => (
                                        <article
                                            key={p.id}
                                            className="border border-base-300 rounded-lg p-4"
                                        >
                                            <h3 className="font-bold text-sm">{p.title}</h3>
                                            <p className="text-xs text-primary mb-2">
                                                {p.subtitle}
                                            </p>
                                            <p className="text-xs text-base-content/75">
                                                {p.description}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Live tools */}
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/60 mb-3 pb-2 border-b border-base-300">
                                Live Tools On This Site
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <Link
                                    to="/regex-playground"
                                    className="border border-base-300 rounded-lg p-4 hover:border-primary hover:bg-base-200 transition-colors group"
                                >
                                    <h3 className="font-bold text-sm group-hover:text-primary">
                                        Regex Playground →
                                    </h3>
                                    <p className="text-xs text-base-content/70 mt-1">
                                        Test, learn, and debug regular expressions with real-time
                                        matching.
                                    </p>
                                </Link>
                                <Link
                                    to="/prompt-generator"
                                    className="border border-base-300 rounded-lg p-4 hover:border-primary hover:bg-base-200 transition-colors group"
                                >
                                    <h3 className="font-bold text-sm group-hover:text-primary">
                                        Prompt Builder →
                                    </h3>
                                    <p className="text-xs text-base-content/70 mt-1">
                                        Compose prompts from files + text, with optional token
                                        counting.
                                    </p>
                                </Link>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default HomePageResume;
