// src/components/HeroSection.tsx

import { motion } from 'motion/react';
import useHeroSection from '@/hooks/useHeroSection';
import { ANIMATION_VARIANTS } from '@/utils/animations';
import AnimatedButton from '@/components/common/AnimatedButton';

function HeroSection() {
    const { heroData, handleCtaClick, handleResumeDownload } = useHeroSection();

    return (
        <motion.section 
            className="hero min-h-screen bg-linear-to-br from-base-200 to-base-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <div className="hero-content text-center max-w-4xl">
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={ANIMATION_VARIANTS.scaleIn.animate}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="avatar"
                    >
                        <div className="w-98 h-98 rounded-lg ring ring-primary ring-offset-base-100 ring-offset-1 overflow-hidden">
                            <img 
                                src="/Seth-Linares-Picture-Headshot.jpeg" 
                                alt={heroData.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-base-content mb-4">
                            {heroData.name}
                        </h1>
                        <h2 className="text-2xl md:text-3xl font-medium text-primary mb-6">
                            {heroData.title}
                        </h2>
                        <p className="text-lg md:text-xl text-base-content/80 max-w-2xl mx-auto leading-relaxed">
                            {heroData.tagline}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <AnimatedButton 
                            onClick={() => handleCtaClick(heroData.cta.primary.link)}
                            variant="primary"
                            size="lg"
                        >
                            {heroData.cta.primary.text}
                        </AnimatedButton>
                        <AnimatedButton 
                            onClick={handleResumeDownload}
                            variant="secondary"
                            size="lg"
                        >
                            📄 Download Resume
                        </AnimatedButton>
                        <AnimatedButton 
                            onClick={() => handleCtaClick(heroData.cta.secondary.link)}
                            variant="outline"
                            size="lg"
                        >
                            {heroData.cta.secondary.text}
                        </AnimatedButton>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}

export default HeroSection;