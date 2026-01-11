// src/components/Navbar.tsx

import { useNavbar } from '@/hooks/useNavbar';
import { motion, useTransform, AnimatePresence, useMotionValueEvent } from 'motion/react';
import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import { IoChevronUpOutline } from 'react-icons/io5';
import ThemeSwitcher from './ThemeSwitcher';
import AnimatedLogo from './common/AnimatedLogo';
import { ANIMATION_VARIANTS, ANIMATION_TIMING } from '@/utils/animations';
import { NavButtonProps } from '@/types/navigation';

const NavButton = React.memo(function NavButton({
    label,
    isActive,
    isHovered,
    onClick,
    onHoverStart,
    onHoverEnd,
}: NavButtonProps) {
    return (
        <motion.button
            className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
            onClick={onClick}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            whileHover={ANIMATION_VARIANTS.buttonHover}
            whileTap={ANIMATION_VARIANTS.buttonTap}
        >
            {/* Background with active/hover states */}
            <motion.div
                className="absolute inset-0 rounded-lg"
                initial={false}
                animate={{
                    backgroundColor: isActive
                        ? 'rgba(124, 58, 237, 0.1)'
                        : isHovered
                          ? 'rgba(156, 163, 175, 0.1)'
                          : 'rgba(0, 0, 0, 0)',
                    borderWidth: isActive ? 1 : 0,
                    borderColor: isActive ? 'rgba(124, 58, 237, 0.3)' : 'rgba(0, 0, 0, 0)',
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            />

            {/* Text with color transition */}
            <span
                className={`relative z-10 ${
                    isActive
                        ? 'bg-linear-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent'
                        : 'text-base-content'
                }`}
            >
                {label}
            </span>

            {/* Active indicator dot */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        className="absolute -bottom-1 left-1/2 w-1 h-1 bg-linear-to-r from-violet-500 to-blue-500 rounded-full"
                        initial={{ opacity: 0, scale: 0, x: '-50%' }}
                        animate={{ opacity: 1, scale: 1, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0, x: '-50%' }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );
});

function Navbar() {
    const {
        isMobileMenuOpen,
        navbarHeight,
        navbarOpacity,
        navbarVisibility,
        isHomePage,
        activeSection,
        hoveredItem,
        isLogoHovered,
        pullTabHintShown,
        toggleMobileMenu,
        closeMobileMenu,
        showNavbar,
        navigateToSection,
        setHoveredItem,
        setIsLogoHovered,
        setPullTabHintShown,
        scrollProgress,
    } = useNavbar();

    // State to track pull tab visibility
    const [isPullTabVisible, setIsPullTabVisible] = useState(false);

    // Listen to navbar visibility changes
    useMotionValueEvent(navbarVisibility, 'change', (latest) => {
        setIsPullTabVisible(latest < 0.5);
    });

    // Memoize navigation items to prevent recreation on each render
    const navigationItems = useMemo(
        () => [
            { id: 'about', label: 'About' },
            { id: 'experience', label: 'Experience' },
            { id: 'projects', label: 'Projects' },
            { id: 'skills', label: 'Skills' },
            { id: 'education', label: 'Education' },
            { id: 'tools', label: 'Tools' },
            { id: 'contact', label: 'Contact' },
        ],
        []
    );

    // Memoize logo hover handlers
    const handleLogoHoverStart = useCallback(() => setIsLogoHovered(true), [setIsLogoHovered]);
    const handleLogoHoverEnd = useCallback(() => setIsLogoHovered(false), [setIsLogoHovered]);

    // Logo click scrolls to hero on home page
    const handleLogoClick = useCallback(
        (e: React.MouseEvent) => {
            closeMobileMenu();
            if (isHomePage) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        [isHomePage, closeMobileMenu]
    );

    return (
        <>
            <motion.header
                className="fixed top-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-md shadow-sm"
                style={{
                    height: navbarHeight,
                    opacity: navbarOpacity,
                    y: useTransform(navbarVisibility, [0, 1], ['-100%', '0%']),
                }}
            >
                {/* Scroll Progress Indicator */}
                {isHomePage && (
                    <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-violet-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{
                            width: `${Math.min(scrollProgress * 100, 100)}%`,
                            opacity: scrollProgress > 0.05 && scrollProgress < 0.95 ? 0.7 : 0,
                        }}
                        transition={{ duration: 0.1 }}
                    />
                )}

                <nav className="navbar container mx-auto px-4 h-full">
                    <div className="flex-1">
                        <Link to="/" onClick={handleLogoClick} className="inline-block">
                            <AnimatedLogo
                                isHovered={isLogoHovered}
                                onHoverStart={handleLogoHoverStart}
                                onHoverEnd={handleLogoHoverEnd}
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex flex-none gap-1 items-center">
                        {!isHomePage && (
                            <motion.div
                                whileHover={ANIMATION_VARIANTS.buttonHover}
                                whileTap={ANIMATION_VARIANTS.buttonTap}
                            >
                                <Link
                                    to="/"
                                    className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-base-200 transition-colors"
                                >
                                    Home
                                </Link>
                            </motion.div>
                        )}

                        {navigationItems.map((item) => (
                            <NavButton
                                key={item.id}
                                label={item.label}
                                isActive={activeSection === item.id}
                                isHovered={hoveredItem === item.id}
                                onClick={() => navigateToSection(item.id)}
                                onHoverStart={() => setHoveredItem(item.id)}
                                onHoverEnd={() => setHoveredItem(null)}
                            />
                        ))}

                        <div className="ml-2">
                            <ThemeSwitcher />
                        </div>
                    </div>

                    {/* Mobile Navigation Trigger */}
                    <div className="flex-none md:hidden gap-2">
                        <ThemeSwitcher />
                        <motion.button
                            className="btn btn-square btn-ghost"
                            onClick={toggleMobileMenu}
                            whileHover={ANIMATION_VARIANTS.buttonHover}
                            whileTap={ANIMATION_VARIANTS.buttonTap}
                            aria-expanded={isMobileMenuOpen}
                            aria-label="Toggle navigation menu"
                        >
                            <HiOutlineMenuAlt3 className="w-5 h-5" />
                        </motion.button>
                    </div>

                    {/* Mobile Menu */}
                    <AnimatePresence mode="wait">
                        {isMobileMenuOpen && (
                            <motion.div
                                className="md:hidden absolute top-full left-0 right-0 bg-base-100/95 backdrop-blur-md shadow-xl border-t border-base-300 overflow-hidden"
                                initial={{ maxHeight: 0, opacity: 0 }}
                                animate={{ maxHeight: 500, opacity: 1 }}
                                exit={{ maxHeight: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <motion.div
                                    className="flex flex-col p-4 space-y-2"
                                    initial="closed"
                                    animate="open"
                                    exit="closed"
                                    variants={{
                                        open: {
                                            transition: {
                                                staggerChildren: ANIMATION_TIMING.STAGGER_DELAY,
                                                delayChildren: 0.1,
                                            },
                                        },
                                        closed: {
                                            transition: {
                                                staggerChildren: ANIMATION_TIMING.MICRO_DELAY,
                                                staggerDirection: -1,
                                            },
                                        },
                                    }}
                                >
                                    {!isHomePage && (
                                        <motion.div variants={ANIMATION_VARIANTS.fadeUpSubtle}>
                                            <Link
                                                to="/"
                                                className="block px-4 py-3 text-lg font-medium rounded-lg hover:bg-base-200 transition-colors"
                                                onClick={closeMobileMenu}
                                            >
                                                Home
                                            </Link>
                                        </motion.div>
                                    )}

                                    {navigationItems.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            variants={ANIMATION_VARIANTS.fadeUpSubtle}
                                        >
                                            <motion.button
                                                className={`block w-full text-left px-4 py-3 text-lg font-medium rounded-lg transition-colors relative ${
                                                    activeSection === item.id
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'hover:bg-base-200'
                                                }`}
                                                onClick={() => navigateToSection(item.id)}
                                                whileHover={{ x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {item.label}
                                                {activeSection === item.id && (
                                                    <motion.div
                                                        className="absolute left-0 top-1/2 w-1 h-8 bg-linear-to-b from-violet-500 to-blue-500 rounded-r-full"
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        style={{ y: '-50%' }}
                                                    />
                                                )}
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>
            </motion.header>

            {/* Pull Tab */}
            <AnimatePresence>
                {isPullTabVisible && (
                    <motion.div
                        className="fixed top-0 left-1/2 -translate-x-1/2 z-50"
                        variants={ANIMATION_VARIANTS.scaleIn}
                        initial="initial"
                        animate="animate"
                        exit="initial"
                    >
                        <motion.button
                            className="bg-base-100/95 backdrop-blur-md shadow-xl rounded-b-xl px-6 py-3 border border-base-300 group"
                            onClick={showNavbar}
                            onHoverStart={() => !pullTabHintShown && setPullTabHintShown(true)}
                            whileHover={{ scale: 1.05, y: 2 }}
                            whileTap={ANIMATION_VARIANTS.buttonTap}
                            aria-label="Show navigation bar"
                        >
                            {/* Gradient background on hover */}
                            <motion.div
                                className="absolute inset-0 bg-linear-to-r from-violet-500/10 to-blue-500/10 rounded-b-xl"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />

                            {/* Icon with subtle animation */}
                            <motion.div
                                animate={{ y: [0, -3, 0] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: 'reverse',
                                    ease: 'easeInOut',
                                }}
                            >
                                <IoChevronUpOutline className="w-6 h-6 text-base-content/60 group-hover:text-primary transition-colors relative z-10" />
                            </motion.div>

                            {/* Tooltip */}
                            <AnimatePresence>
                                {!pullTabHintShown && (
                                    <motion.div
                                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-base-content text-base-100 text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none"
                                        variants={ANIMATION_VARIANTS.fadeUp}
                                        initial="initial"
                                        animate="animate"
                                        exit="initial"
                                        transition={{ delay: 2 }}
                                    >
                                        Pull to show navigation
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-base-content" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default Navbar;
