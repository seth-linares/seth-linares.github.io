import { motion } from 'motion/react';
import useAboutSection from '@/hooks/useAboutSection';

function AboutSection() {
    const { aboutData, getValueIcon } = useAboutSection();

    return (
        <section id="about" className="py-20 bg-base-100">
            <div className="container mx-auto px-4 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-base-content mb-4">About Me</h2>
                    <div className="w-24 h-1 bg-primary mx-auto"></div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-lg text-base-content/80 leading-relaxed mb-8">
                            {aboutData.summary}
                        </p>
                        
                        <div className="space-y-4">
                            <h3 className="text-2xl font-semibold text-base-content mb-4">Key Highlights</h3>
                            {aboutData.highlights.map((highlight, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 * index }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-base-content/80">{highlight}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <h3 className="text-2xl font-semibold text-base-content mb-6">Core Values</h3>
                        {aboutData.values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 * index }}
                                viewport={{ once: true }}
                                className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                            >
                                <div className="card-body p-6">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <span className="text-2xl">{getValueIcon(value.icon)}</span>
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