// src/components/ExperienceSection.tsx

import { motion } from 'motion/react';
import useExperienceSection from '@/hooks/useExperienceSection';
import SectionHeader from '@/components/common/SectionHeader';
import AnimatedCard from '@/components/common/AnimatedCard';

function ExperienceSection() {
    const { experienceData } = useExperienceSection();
    return (
        <section id="experience" className="py-20 bg-base-200">
            <div className="container mx-auto px-4 max-w-6xl">
                <SectionHeader title="Professional Experience" />

                <div className="space-y-8">
                    {experienceData.map((experience, index) => (
                        <AnimatedCard key={index} index={index} className="bg-base-100">
                            <div className="card-body p-8">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                                    <div className="mb-4 lg:mb-0">
                                        <h3 className="text-2xl font-bold text-base-content mb-2">
                                            {experience.position}
                                        </h3>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <span className="text-xl font-semibold text-primary">
                                                {experience.company}
                                            </span>
                                            <span className="text-base-content/60">
                                                • {experience.location}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base-content/70 font-medium">
                                            {experience.duration}
                                        </span>
                                        {experience.current && (
                                            <span className="badge badge-primary">Current</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <h4 className="text-lg font-semibold text-base-content">
                                        Key Achievements
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {experience.achievements.map(
                                            (achievement, achievementIndex) => (
                                                <motion.div
                                                    key={achievementIndex}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    transition={{
                                                        duration: 0.4,
                                                        delay: achievementIndex * 0.05,
                                                    }}
                                                    viewport={{ once: true }}
                                                    className="flex items-start gap-3"
                                                >
                                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>
                                                    <p className="text-base-content/80 text-sm leading-relaxed">
                                                        {achievement}
                                                    </p>
                                                </motion.div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-base-content mb-3">
                                        Technologies Used
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {experience.technologies.map((tech, techIndex) => (
                                            <span
                                                key={techIndex}
                                                className="badge badge-outline text-xs"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AnimatedCard>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ExperienceSection;
