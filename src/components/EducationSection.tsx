// src/components/EducationSection.tsx

import { motion } from 'motion/react';
import { ANIMATION_VARIANTS, createStaggeredDelay, createCompoundDelay, VIEWPORT_CONFIG, CARD_VIEWPORT_CONFIG } from '@/utils/animations';
import { siteData } from '@/personal-site-data';

const educationData = siteData.education;

function EducationSection() {
    return (
        <section id="education" className="py-20 bg-base-100">
            <div className="container mx-auto px-4 max-w-6xl">
                <motion.div
                    {...ANIMATION_VARIANTS.fadeUp}
                    whileInView={ANIMATION_VARIANTS.fadeUp.animate}
                    viewport={VIEWPORT_CONFIG}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-base-content mb-4">Education</h2>
                    <div className="w-24 h-1 bg-primary mx-auto mb-4"></div>
                    <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                        Academic foundation and continuous learning journey
                    </p>
                </motion.div>

                <div className="space-y-8">
                    {educationData.map((education, index) => (
                        <motion.div
                            key={index}
                            initial={{ 
                                opacity: 0, 
                                x: index % 2 === 0 ? -20 : 20 
                            }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: createStaggeredDelay(index)
                            }}
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                            viewport={CARD_VIEWPORT_CONFIG}
                            className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
                        >
                            <div className="card-body p-8">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                    <div className="flex-1 mb-6 lg:mb-0">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span className="text-2xl">🎓</span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-base-content mb-1">
                                                    {education.degree}
                                                </h3>
                                                <p className="text-lg font-semibold text-primary">
                                                    {education.institution}
                                                </p>
                                                <p className="text-base-content/60">
                                                    {education.location} • {education.duration}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {education.highlights.map((highlight, highlightIndex) => (
                                                <motion.div
                                                    key={highlightIndex}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    transition={{
                                                        duration: 0.4,
                                                        delay: createCompoundDelay(index, highlightIndex)
                                                    }}
                                                    viewport={VIEWPORT_CONFIG}
                                                    className="flex items-start gap-3"
                                                >
                                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                                    <p className="text-base-content/80">{highlight}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="lg:ml-8 flex flex-col items-start lg:items-end">
                                        <div className="text-right mb-4">
                                            <div className="text-3xl font-bold text-primary mb-1">
                                                {education.gpa}
                                            </div>
                                            <div className="text-sm text-base-content/60 uppercase tracking-wide">
                                                GPA
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                                            {index === 0 && (
                                                <>
                                                    <span className="badge badge-primary">
                                                        Computer Science
                                                    </span>
                                                    <span className="badge badge-outline">
                                                        Bachelor's Degree
                                                    </span>
                                                </>
                                            )}
                                            {index === 1 && (
                                                <>
                                                    <span className="badge badge-primary">
                                                        Network IT
                                                    </span>
                                                    <span className="badge badge-outline">
                                                        Associate's Degree
                                                    </span>
                                                    <span className="badge badge-secondary">
                                                        AWS Certified
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={ANIMATION_VARIANTS.fadeUp.initial}
                    whileInView={ANIMATION_VARIANTS.fadeUp.animate}
                    transition={{
                        ...ANIMATION_VARIANTS.fadeUp.transition,
                        delay: 0.3
                    }}
                    viewport={CARD_VIEWPORT_CONFIG}
                    className="mt-12 text-center"
                >
                    <div className="card bg-base-200 shadow-lg max-w-4xl mx-auto">
                        <div className="card-body p-8">
                            <h3 className="text-2xl font-bold text-base-content mb-4">
                                Certifications & Achievements
                            </h3>
                            <div className="flex flex-wrap justify-center gap-4">
                                <div className="badge badge-lg badge-primary p-4">
                                    🏆 Full-ride Academic Scholarship
                                </div>
                                <div className="badge badge-lg badge-secondary p-4">
                                    ☁️ AWS Solutions Architect
                                </div>
                                <div className="badge badge-lg badge-accent p-4">
                                    🥇 Summa Cum Laude (3.99 GPA)
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default EducationSection;