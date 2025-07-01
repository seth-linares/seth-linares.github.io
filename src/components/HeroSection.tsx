import { motion } from 'motion/react';
import useHeroSection from '@/hooks/useHeroSection';

function HeroSection() {
    const { heroData, handleCtaClick, handleResumeDownload } = useHeroSection();

    return (
        <motion.section 
            className="hero min-h-screen bg-gradient-to-br from-base-200 to-base-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <div className="hero-content text-center max-w-4xl">
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
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
                        <button 
                            onClick={() => handleCtaClick(heroData.cta.primary.link)}
                            className="btn btn-primary btn-lg"
                        >
                            {heroData.cta.primary.text}
                        </button>
                        <button 
                            onClick={handleResumeDownload}
                            className="btn btn-secondary btn-lg"
                        >
                            📄 Download Resume
                        </button>
                        <button 
                            onClick={() => handleCtaClick(heroData.cta.secondary.link)}
                            className="btn btn-outline btn-lg"
                        >
                            {heroData.cta.secondary.text}
                        </button>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}

export default HeroSection;