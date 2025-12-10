// src/components/AboutSection.tsx

import { motion } from 'motion/react';
import useAboutSection from '@/hooks/useAboutSection';
import { ANIMATION_VARIANTS, CARD_VIEWPORT_CONFIG, createStaggeredDelay } from '@/utils/animations';
import SectionHeader from '@/components/common/SectionHeader';

function AboutSection() {
    const { aboutData, getValueIcon } = useAboutSection();

    return (
        <section id="about" className="py-20 bg-base-100">
            <div className="container mx-auto px-4 max-w-6xl">
                <SectionHeader title="About Me" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        {...ANIMATION_VARIANTS.slideLeft}
                        whileInView={{
                            ...ANIMATION_VARIANTS.slideLeft.animate,
                            transition: {
                                ...ANIMATION_VARIANTS.slideLeft.transition,
                                delay: 0.2
                            }
                        }}
                        viewport={CARD_VIEWPORT_CONFIG}
                    >
                        <p className="text-lg text-base-content/80 leading-relaxed mb-8">
                            {aboutData.summary}
                        </p>
                        
                        <div className="space-y-4">
                            <h3 className="text-2xl font-semibold text-base-content mb-4">Key Highlights</h3>
                            {aboutData.highlights.map((highlight, index) => (
                                <motion.div
                                    key={index}
                                    {...ANIMATION_VARIANTS.fadeUpSubtle}
                                    whileInView={{
                                        ...ANIMATION_VARIANTS.fadeUpSubtle.animate,
                                        transition: {
                                            ...ANIMATION_VARIANTS.fadeUpSubtle.transition,
                                            delay: createStaggeredDelay(index, 0.3)
                                        }
                                    }}
                                    viewport={CARD_VIEWPORT_CONFIG}
                                    className="flex items-start gap-3"
                                >
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>
                                    <p className="text-base-content/80">{highlight}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        {...ANIMATION_VARIANTS.slideRight}
                        whileInView={{
                            ...ANIMATION_VARIANTS.slideRight.animate,
                            transition: {
                                ...ANIMATION_VARIANTS.slideRight.transition,
                                delay: 0.4
                            }
                        }}
                        viewport={CARD_VIEWPORT_CONFIG}
                        className="space-y-6"
                    >
                        <h3 className="text-2xl font-semibold text-base-content mb-6">Core Values</h3>
                        {aboutData.values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={ANIMATION_VARIANTS.fadeUpSubtle.initial}
                                whileInView={{
                                    ...ANIMATION_VARIANTS.fadeUpSubtle.animate,
                                    transition: {
                                        ...ANIMATION_VARIANTS.fadeUpSubtle.transition,
                                        delay: 0.1 * index
                                    }
                                }}
                                whileHover={{
                                    ...ANIMATION_VARIANTS.buttonHover,
                                    y: -2,
                                }}
                                viewport={CARD_VIEWPORT_CONFIG}
                                className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                            >
                                <div className="card-body p-6">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <img src={getValueIcon(value.icon)} alt={value.title} className="w-8 h-8" />
                                        </div>
                                        <h4 className="text-xl font-semibold text-base-content">
                                            {value.title}
                                        </h4>
                                    </div>
                                    <p className="text-base-content/70 leading-relaxed">
                                        {value.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

export default AboutSection;