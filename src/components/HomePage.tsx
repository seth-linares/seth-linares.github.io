// src/components/HomePage.tsx

import { Link } from 'react-router-dom';
import useHomePage from '@/hooks/useHomePage';
import SectionHeader from './common/SectionHeader';
import AnimatedCard from './common/AnimatedCard';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ExperienceSection from './ExperienceSection';
import ProjectsSection from './ProjectsSection';
import SkillsSection from './SkillsSection';
import EducationSection from './EducationSection';
import ContactSection from './ContactSection';

function HomePage() {
    const { location, toolsData } = useHomePage();

    return (
        <div 
            key={location.pathname}
            className="min-h-screen"
        >
            <HeroSection />
            <AboutSection />
            <ExperienceSection />
            <ProjectsSection />
            <SkillsSection />
            <EducationSection />
            
            {/* Tools Section - Highlighting Prompt Builder */}
            <section id="tools" className="py-20 bg-base-100">
                <div className="container mx-auto px-4 max-w-6xl">
                    <SectionHeader 
                        title={toolsData.title} 
                        description={toolsData.description} 
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {toolsData.tools.map((tool, index) => (
                            <AnimatedCard
                                key={tool.id}
                                index={index}
                                className="bg-base-200"
                            >
                                <div className="card-body p-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <span className="text-2xl">{tool.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-base-content">{tool.title}</h3>
                                            <p className="text-primary font-medium">{tool.subtitle}</p>
                                        </div>
                                    </div>
                                    <p className="text-base-content/80 leading-relaxed mb-6">
                                        {tool.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {tool.technologies.map((tech, techIndex) => (
                                            <span key={techIndex} className="badge badge-outline text-xs">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="card-actions justify-end">
                                        <Link to={tool.link} className="btn btn-primary">
                                            {tool.linkText}
                                        </Link>
                                    </div>
                                </div>
                            </AnimatedCard>
                        ))}
                    </div>
                </div>
            </section>

            <ContactSection />
        </div>
    );
}

export default HomePage;