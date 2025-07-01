// src/components/HomePage.tsx

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ANIMATION_VARIANTS, CARD_VIEWPORT_CONFIG } from '@/utils/animations';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ExperienceSection from './ExperienceSection';
import ProjectsSection from './ProjectsSection';
import SkillsSection from './SkillsSection';
import EducationSection from './EducationSection';
import ContactSection from './ContactSection';

function HomePage() {
    const location = useLocation();

    return (
        <div 
            key={location.pathname}
            className="min-h-screen"
        >
            <HeroSection />
            <AboutSection />
            <ExperienceSection />
            <ProjectsSection />
            <SkillsSection />
            <EducationSection />
            
            {/* Tools Section - Highlighting Prompt Builder */}
            <section id="tools" className="py-20 bg-base-100">
                <div className="container mx-auto px-4 max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-base-content mb-4">Developer Tools</h2>
                        <div className="w-24 h-1 bg-primary mx-auto mb-4"></div>
                        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                            Practical tools built to solve real development challenges
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <motion.div
                            initial={ANIMATION_VARIANTS.cardEntry.initial}
                            whileInView={ANIMATION_VARIANTS.cardEntry.animate}
                            whileHover={ANIMATION_VARIANTS.cardHover}
                            viewport={CARD_VIEWPORT_CONFIG}
                            className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
                        >
                            <div className="card-body p-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">🤖</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-base-content">Prompt Builder</h3>
                                        <p className="text-primary font-medium">AI Prompt Engineering Tool</p>
                                    </div>
                                </div>
                                <p className="text-base-content/80 leading-relaxed mb-6">
                                    Build prompts by combining files and text with optional token counting. 
                                    Perfect for LLM prompt engineering and context management.
                                </p>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="badge badge-outline text-xs">React</span>
                                    <span className="badge badge-outline text-xs">TypeScript</span>
                                    <span className="badge badge-outline text-xs">Anthropic API</span>
                                </div>
                                <div className="card-actions justify-end">
                                    <Link to="/prompt-generator" className="btn btn-primary">
                                        Try It Now
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <ContactSection />
        </div>
    );
}

export default HomePage;