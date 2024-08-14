import React from 'react';
import useThemeSwitcher from "../hooks/useThemeSwitcher";

const themes = [
    "acid", "aqua", "autumn", "black", "bumblebee", "business", "cmyk",
    "coffee", "corporate", "cupcake", "cyberpunk", "dark", "dim", "dracula",
    "emerald", "fantasy", "forest", "garden", "halloween", "lemonade",
    "light", "lofi", "luxury", "night", "nord", "pastel", "retro", "sunset",
    "synthwave", "valentine", "winter", "wireframe"
] as const;

const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const ThemeSwitcher: React.FC = () => {
    const { currentTheme, changeTheme } = useThemeSwitcher(themes);

    return (
        <div className="form-control w-full max-w-xs">
            <h3 className="font-semibold mb-2">
                Currently Selected Theme: {capitalizeFirstLetter(currentTheme)}
            </h3>
            <label className="label" htmlFor="theme-select">
                <span className="label-text">Choose a theme:</span>
            </label>
            <select
                id="theme-select"
                className="select select-bordered w-full p-2 text-center"
                value={currentTheme}
                onChange={(e) => {
                    const newTheme = e.target.value;
                    changeTheme(newTheme as typeof themes[number])
                }
            }
            >
                {themes.map((theme) => (
                    <option key={theme} value={theme}>
                        {capitalizeFirstLetter(theme)}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default ThemeSwitcher;