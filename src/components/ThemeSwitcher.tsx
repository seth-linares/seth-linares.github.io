// src/components/ThemeSwitcher.tsx

import { IoColorPaletteOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'motion/react';
import useThemeSwitcher from '@/hooks/useThemeSwitcher';

const THEMES = [
    "acid", "aqua", "autumn", "black", "bumblebee", "business", "cmyk",
    "coffee", "corporate", "cupcake", "cyberpunk", "dark", "dim", "dracula",
    "emerald", "fantasy", "forest", "garden", "halloween", "lemonade",
    "light", "lofi", "luxury", "night", "nord", "pastel", "retro", "sunset", 
    "sweetandmore", "synthwave", "valentine", "winter", "wireframe"
] as const;


const ThemeSwitcher: React.FC = () => {
    const { isOpen, currentTheme, setIsOpen, changeTheme } = useThemeSwitcher(THEMES);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-ghost btn-circle"
                aria-label="Theme switcher"
            >
                <IoColorPaletteOutline className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 rounded-lg bg-base-200 shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-[calc(50vh-100px)]"
                    >
                        <div className="py-1 overflow-y-auto max-h-[inherit] scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => {
                                        changeTheme(theme);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-sm hover:bg-base-300 text-left capitalize
                                        ${currentTheme === theme ? 'bg-primary/10' : ''}`}
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ThemeSwitcher;