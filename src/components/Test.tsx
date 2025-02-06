// src/components/Test.tsx

import { useNavbar } from "@/hooks/useNavbar";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import Navbar from "./Navbar";

function Test() {
    const { navbarHeight } = useNavbar();
    const { 
        contentScale, 
        contentOpacity, 
        rotateX, 
        translateY, 
        scale, 
        backgroundColor 
    } = useScrollAnimation();

    // Create ref for progress bar
    const progressRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: progressRef,
        offset: ["start start", "end end"]
    });

    // Smooth out the progress bar animation
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Create transform values for each layer outside the map function
    const layer1Y = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const layer2Y = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const layer3Y = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const layerYValues = [layer1Y, layer2Y, layer3Y];
    

    return (
        <div className="min-h-screen bg-base-100" ref={progressRef}>
            <Navbar />
            
            {/* Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
                style={{ scaleX: smoothProgress }}
            />
            
            {/* Header Section */}
            <motion.section 
                style={{ 
                    paddingTop: navbarHeight,
                    scale: contentScale,
                    opacity: contentOpacity
                }}
                className="h-screen overflow-y-auto flex flex-col items-center bg-base-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <motion.h1 
                    className="text-4xl font-bold sticky top-0 bg-base-200 p-4 w-full text-center"
                    style={{ y: translateY }}
                >
                    Scroll Test Page
                </motion.h1>
                {/* Add scrollable content */}
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-full p-8 border-b border-base-300">
                        <h2 className="text-2xl mb-4">Section {i + 1}</h2>
                        <p className="text-lg">Scroll within this section to test the animation!</p>
                    </div>
                ))}
            </motion.section>

            {/* Rotating Cards Section */}
            <motion.section
                className="h-screen overflow-y-auto flex flex-col items-center p-8 bg-base-300"
                style={{ backgroundColor }}
            >
                <h2 className="text-3xl mb-6 sticky top-0 bg-base-300 p-4 w-full text-center">Rotating Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="p-8 bg-base-100 rounded-lg shadow-lg"
                            style={{
                                rotateX,
                                scale,
                            }}
                        >
                            <h3 className="text-2xl mb-4">Card {i + 1}</h3>
                            <p className="mb-4">Scroll to see the rotation effect!</p>
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Parallax Section */}
            <motion.section className="h-screen overflow-y-auto relative bg-base-200">
                <div className="sticky top-0 h-screen flex items-center justify-center">
                    {[1, 2, 3].map((layer, index) => (
                        <motion.div
                            key={layer}
                            className="absolute w-full h-full flex items-center justify-center"
                            style={{
                                y: layerYValues[index]
                            }}
                        >
                            <div 
                                className="text-9xl font-bold"
                                style={{ 
                                    filter: `blur(${layer * 2}px)`,
                                    opacity: 0.2 * layer
                                }}
                            >
                                PARALLAX
                            </div>
                        </motion.div>
                    ))}
                </div>
                {/* Add scrollable content under parallax */}
                <div className="min-h-screen bg-base-200 relative z-10 mt-screen p-8">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="mb-8 p-6 bg-base-100 rounded-lg">
                            <h3 className="text-2xl mb-4">Parallax Content {i + 1}</h3>
                            <p>Scroll to see the parallax effect in action!</p>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* Interactive Grid Section */}
            <section className="h-screen overflow-y-auto p-8 bg-base-300">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl mb-8 text-center sticky top-0 bg-base-300 p-4">Interactive Grid</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 16 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="aspect-square bg-primary rounded-lg"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: false, amount: 0.8 }}
                                transition={{ 
                                    duration: 0.5, 
                                    delay: i * 0.1 
                                }}
                                whileHover={{ 
                                    scale: 1.05,
                                    rotate: 5,
                                    transition: { duration: 0.2 } 
                                }}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Test;