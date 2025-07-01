import { motion } from 'motion/react';
import useSkillsSection from '@/hooks/useSkillsSection';
import { ANIMATION_VARIANTS, createStaggeredDelay, createCompoundDelay, VIEWPORT_CONFIG } from '@/utils/animations';

function SkillsSection() {
    const { skillsData, getCategoryIcon } = useSkillsSection();

    return (
        <section id="skills" className="py-20 bg-base-200">
            <div className="container mx-auto px-4 max-w-6xl">
                <motion.div
                    {...ANIMATION_VARIANTS.fadeUp}
                    whileInView={ANIMATION_VARIANTS.fadeUp.animate}
                    viewport={VIEWPORT_CONFIG}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-base-content mb-4">Technical Skills</h2>
                    <div className="w-24 h-1 bg-primary mx-auto mb-4"></div>
                    <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                        A comprehensive overview of my technical expertise across various domains
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {skillsData.categories.map((category, index) => (
                        <motion.div
                            key={index}
                            initial={ANIMATION_VARIANTS.fadeUp.initial}
                            whileInView={ANIMATION_VARIANTS.fadeUp.animate}
                            transition={{
                                ...ANIMATION_VARIANTS.fadeUp.transition,
                                delay: createStaggeredDelay(index)
                            }}
                            viewport={VIEWPORT_CONFIG}
                            className="card bg-base-100 shadow-lg"
                        >
                            <div className="card-body p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">{getCategoryIcon(category.name)}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-base-content">
                                        {category.name}
                                    </h3>
                                </div>

                                <motion.div 
                                    className="grid grid-cols-2 gap-3"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ 
                                        duration: 0.4, 
                                        delay: createStaggeredDelay(index, 0.2),
                                        staggerChildren: 0.05
                                    }}
                                    viewport={VIEWPORT_CONFIG}
                                >
                                    {category.skills.map((skill, skillIndex) => (
                                        <motion.div
                                            key={skillIndex}
                                            initial={ANIMATION_VARIANTS.scaleIn.initial}
                                            whileInView={ANIMATION_VARIANTS.scaleIn.animate}
                                            transition={{
                                                ...ANIMATION_VARIANTS.scaleIn.transition,
                                                delay: createCompoundDelay(index, skillIndex, 0.2)
                                            }}
                                            viewport={VIEWPORT_CONFIG}
                                            className="badge badge-outline text-sm p-3 h-auto justify-center hover:badge-primary transition-colors duration-200"
                                        >
                                            {skill}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={ANIMATION_VARIANTS.fadeUp.initial}
                    whileInView={ANIMATION_VARIANTS.fadeUp.animate}
                    transition={{
                        ...ANIMATION_VARIANTS.fadeUp.transition,
                        delay: 0.4
                    }}
                    viewport={VIEWPORT_CONFIG}
                    className="mt-12 text-center"
                >
                    <div className="card bg-base-100 shadow-lg max-w-4xl mx-auto">
                        <div className="card-body p-8">
                            <h3 className="text-2xl font-bold text-base-content mb-4">
                                Current Focus Areas
                            </h3>
                            <div className="flex flex-wrap justify-center gap-3">
                                {['Rust Development', 'Security Engineering', 'Cloud Architecture', 'AI/ML Integration'].map((focus, index) => (
                                    <motion.span
                                        key={index}
                                        initial={ANIMATION_VARIANTS.fadeUpSubtle.initial}
                                        whileInView={ANIMATION_VARIANTS.fadeUpSubtle.animate}
                                        transition={{
                                            ...ANIMATION_VARIANTS.fadeUpSubtle.transition,
                                            delay: createStaggeredDelay(index, 0.6)
                                        }}
                                        viewport={VIEWPORT_CONFIG}
                                        className="badge badge-primary badge-lg p-4 text-primary-content"
                                    >
                                        {focus}
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default SkillsSection;