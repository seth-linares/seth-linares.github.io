// src/components/ContactSection.tsx

import React, { useCallback } from 'react';
import { motion } from 'motion/react';
import useContactSection from '@/hooks/useContactSection';
import { ANIMATION_VARIANTS, CARD_VIEWPORT_CONFIG } from '@/utils/animations';
import SectionHeader from '@/components/common/SectionHeader';

function ContactSection() {
    const { contactData, handleContactClick, getContactIcon } = useContactSection();

    // Memoize click handlers
    const handleEmailClick = useCallback(
        () => handleContactClick('email', contactData.email),
        [handleContactClick, contactData.email]
    );
    const handlePhoneClick = useCallback(
        () => handleContactClick('phone', contactData.phone),
        [handleContactClick, contactData.phone]
    );
    const handleLinkedInClick = useCallback(
        () => handleContactClick('linkedin', contactData.linkedin),
        [handleContactClick, contactData.linkedin]
    );
    const handleGithubClick = useCallback(
        () => handleContactClick('github', contactData.github),
        [handleContactClick, contactData.github]
    );

    return (
        <section id="contact" className="py-20 bg-base-200">
            <div className="container mx-auto px-4 max-w-6xl">
                <SectionHeader
                    title="Get In Touch"
                    description="Let's connect and discuss opportunities, projects, or just have a great conversation about technology"
                />

                <motion.div
                    variants={ANIMATION_VARIANTS.cardContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={CARD_VIEWPORT_CONFIG}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >
                    <motion.div
                        variants={ANIMATION_VARIANTS.cardItem}
                        whileHover={ANIMATION_VARIANTS.buttonHover}
                        whileTap={ANIMATION_VARIANTS.buttonTap}
                        className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={handleEmailClick}
                    >
                        <div className="card-body items-center text-center p-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <img
                                    src={getContactIcon('email')}
                                    alt="Email"
                                    className="w-8 h-8"
                                />
                            </div>
                            <h3 className="text-lg font-bold text-base-content mb-2">Email</h3>
                            <p className="text-base-content/70 text-sm break-all">
                                {contactData.email}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={ANIMATION_VARIANTS.cardItem}
                        whileHover={ANIMATION_VARIANTS.buttonHover}
                        whileTap={ANIMATION_VARIANTS.buttonTap}
                        className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={handlePhoneClick}
                    >
                        <div className="card-body items-center text-center p-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <img
                                    src={getContactIcon('phone')}
                                    alt="Phone"
                                    className="w-8 h-8 ml-4"
                                />
                            </div>
                            <h3 className="text-lg font-bold text-base-content mb-2">Phone</h3>
                            <p className="text-base-content/70 text-sm">{contactData.phone}</p>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={ANIMATION_VARIANTS.cardItem}
                        whileHover={ANIMATION_VARIANTS.buttonHover}
                        whileTap={ANIMATION_VARIANTS.buttonTap}
                        className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={handleLinkedInClick}
                    >
                        <div className="card-body items-center text-center p-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <img
                                    src={getContactIcon('linkedin')}
                                    alt="LinkedIn"
                                    className="w-8 h-8"
                                />
                            </div>
                            <h3 className="text-lg font-bold text-base-content mb-2">LinkedIn</h3>
                            <p className="text-base-content/70 text-sm">Professional Profile</p>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={ANIMATION_VARIANTS.cardItem}
                        whileHover={ANIMATION_VARIANTS.buttonHover}
                        whileTap={ANIMATION_VARIANTS.buttonTap}
                        className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={handleGithubClick}
                    >
                        <div className="card-body items-center text-center p-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <img
                                    src={getContactIcon('github')}
                                    alt="github"
                                    className="w-8 h-8"
                                />
                            </div>
                            <h3 className="text-lg font-bold text-base-content mb-2">GitHub</h3>
                            <p className="text-base-content/70 text-sm">Code Portfolio</p>
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
                                I'm always interested in discussing new opportunities, innovative
                                projects, or contributing to meaningful solutions. Whether you're
                                looking for a developer, consultant, or collaborator, let's connect!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleEmailClick}
                                    className="btn btn-primary btn-lg"
                                >
                                    Send Email
                                </button>
                                <button
                                    onClick={handleLinkedInClick}
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

export default React.memo(ContactSection);
