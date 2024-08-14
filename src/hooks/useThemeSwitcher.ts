import {useEffect, useState} from "react";

export default function useThemeSwitcher(themes: readonly string[]) {
    const [currentTheme, setCurrentTheme] = useState<string>(() => {
        const savedTheme: string = localStorage.getItem("theme") ?? "";
        // if the theme isn't a part of the possible themes, then set it to dark -> useful for when user incorrectly alters their theme val
        return themes.includes(savedTheme) ? savedTheme : "dark";
    });

    // run each time the currentTheme is updated and on initial mount
    useEffect(() => {
        // Get theme from our currentTheme state
        // take that saved theme and apply it to our <body> element
        document.body.setAttribute("data-theme", currentTheme);
    }, [currentTheme]);


    const changeTheme = (theme: string) => {
        // store our selected theme into basic local storage for retrieval
        localStorage.setItem("theme", theme);
        // update our local variable to hold new theme
        setCurrentTheme(theme);
    };

    return {
        currentTheme,
        changeTheme,
    }
}