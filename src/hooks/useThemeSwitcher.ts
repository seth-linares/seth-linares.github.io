// src/hooks/useThemeSwitcher.ts

import { useEffect, useState } from "react";

export default function useThemeSwitcher<T extends readonly string[]>(themes: T) {
    const [currentTheme, setCurrentTheme] = useState<T[number]>(() => {
        const savedTheme: string = localStorage.getItem("theme") ?? "";
        // if the theme isn't a part of the possible themes, then set it to dark -> useful for when user incorrectly alters their theme val
        return themes.includes(savedTheme) ? savedTheme : "dark";
    });

    // run each time the currentTheme is updated and on initial mount
    useEffect(() => {
        // Get theme from our currentTheme state
        // take that saved theme and apply it to our <body> element
        document.body.setAttribute("data-theme", currentTheme);
        localStorage.setItem("theme", currentTheme);
    }, [currentTheme]);


    const changeTheme = (theme: T[number]) => {
        // update our local variable to hold new theme
        if(themes.includes(theme)) {
            setCurrentTheme(theme);
        }
        else {
            console.error(`Unknown theme: ${theme}`);
        }
    };

    return {
        currentTheme,
        changeTheme,
    }
}