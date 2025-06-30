// src/components/HomePage.tsx

import { Link } from 'react-router-dom';
import useHomePage from '@/hooks/useHomePage';
import { motion } from 'motion/react';

function HomePage() {
    const { scrollToSection, pageAnimationProps } = useHomePage();

    return (
        <motion.div 
            {...pageAnimationProps}
            className="min-h-screen"
        >
            {/* Hero Section */}
            <section className="hero min-h-screen bg-base-200">
                <div className="hero-content text-center">
                    <div className="max-w-md">
                        <h1 className="text-5xl font-bold">Welcome</h1>
                        <p className="py-6">
                            Explore my projects and tools, including a prompt builder
                            powered AI.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link to="/token-counter" className="btn btn-primary">
                                Try Prompt Builder
                            </Link>
                            <button 
                                className="btn btn-outline"
                                onClick={() => scrollToSection('projects')}
                            >
                                View Projects
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Projects Section */}
            <section id="projects" className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-10">
                        Featured Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title">Prompt Builder</h3>
                                <p>Build prompts by combining files and text, with optional token counting.</p>
                                <div className="card-actions justify-end">
                                    <Link to="/token-counter" className="btn btn-primary">
                                        Try It
                                    </Link>
                                </div>
                            </div>
                        </div>
                        {/* Add more project cards here */}
                    </div>
                </div>
            </section>
        </motion.div>
    );
}

export default HomePage;