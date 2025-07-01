// src/components/ContactSection.tsx

import { motion } from 'motion/react';
import useContactSection from '@/hooks/useContactSection';
import { ANIMATION_VARIANTS, CARD_VIEWPORT_CONFIG } from '@/utils/animations';

function ContactSection() {
    const { contactData, handleContactClick, getContactIcon } = useContactSection();

    return (
        <section id="contact" className="py-20 bg-base-200">
            <div className="container mx-auto px-4 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-base-content mb-4">Get In Touch</h2>
                    <div className="w-24 h-1 bg-primary mx-auto mb-4"></div>
                    <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                        Let's connect and discuss opportunities, projects, or just have a great conversation about technology
                    </p>
                </motion.div>

                <motion.div 
                    variants={ANIMATION_VARIANTS.cardContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={CARD_VIEWPORT_CONFIG}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >
                    <motion.div
                        variants={ANIMATION_VARIANTS.cardItem}
                        whileHover={ANIMATION_VARIANTS.cardHover}
                        whileTap={{ scale: 0.98 }}
                        className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={() => handleContactClick('email', contactData.email)}
                    >
                        <div className="card-body items-center text-center p-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">{getContactIcon('email')}</span>
                            </div>
                            <h3 className="text-lg font-bold text-base-content mb-2">Email</h3>
                            <p className="text-base-content/70 text-sm break-all">
                                {contactData.email}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={ANIMATION_VARIANTS.cardItem}
                        whileHover={ANIMATION_VARIANTS.cardHover}
                        whileTap={{ scale: 0.98 }}
                        className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={() => handleContactClick('phone', contactData.phone)}
                    >
                        <div className="card-body items-center text-center p-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">{getContactIcon('phone')}</span>
                            </div>
                            <h3 className="text-lg font-bold text-base-content mb-2">Phone</h3>
                            <p className="text-base-content/70 text-sm">
                                {contactData.phone}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={ANIMATION_VARIANTS.cardItem}
                        whileHover={ANIMATION_VARIANTS.cardHover}
                        whileTap={{ scale: 0.98 }}
                        className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={() => handleContactClick('linkedin', contactData.linkedin)}
                    >
                        <div className="card-body items-center text-center p-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">{getContactIcon('linkedin')}</span>
                            </div>
                            <h3 className="text-lg font-bold text-base-content mb-2">LinkedIn</h3>
                            <p className="text-base-content/70 text-sm">
                                Professional Profile
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={ANIMATION_VARIANTS.cardItem}
                        whileHover={ANIMATION_VARIANTS.cardHover}
                        whileTap={{ scale: 0.98 }}
                        className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={() => handleContactClick('github', contactData.github)}
                    >
                        <div className="card-body items-center text-center p-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">{getContactIcon('github')}</span>
                            </div>
                            <h3 className="text-lg font-bold text-base-content mb-2">GitHub</h3>
                            <p className="text-base-content/70 text-sm">
                                Code Portfolio
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={ANIMATION_VARIANTS.fadeUp.initial}
                    whileInView={ANIMATION_VARIANTS.fadeUp.animate}
                    viewport={CARD_VIEWPORT_CONFIG}
                    className="text-center"
                >
                    <div className="card bg-base-100 shadow-lg max-w-4xl mx-auto">
                        <div className="card-body p-8">
                            <h3 className="text-2xl font-bold text-base-content mb-4">
                                Ready to Collaborate?
                            </h3>
                            <p className="text-base-content/70 mb-6 max-w-2xl mx-auto">
                                I'm always interested in discussing new opportunities, innovative projects, 
                                or contributing to meaningful solutions. Whether you're looking for a 
                                developer, consultant, or collaborator, let's connect!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => handleContactClick('email', contactData.email)}
                                    className="btn btn-primary btn-lg"
                                >
                                    Send Email
                                </button>
                                <button
                                    onClick={() => handleContactClick('linkedin', contactData.linkedin)}
                                    className="btn btn-outline btn-lg"
                                >
                                    Connect on LinkedIn
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default ContactSection;