import { useEffect } from 'react';


const ThemeSwitcher = () => {
    const themes: string[] = [
        "light",
        "dark",
        "cupcake",
        "bumblebee",
        "emerald",
        "corporate",
        "synthwave",
        "retro",
        "cyberpunk",
        "valentine",
        "halloween",
        "garden",
        "forest",
        "aqua",
        "lofi",
        "pastel",
        "fantasy",
        "wireframe",
        "black",
        "luxury",
        "dracula",
        "cmyk",
        "autumn",
        "business",
        "acid",
        "lemonade",
        "night",
        "coffee",
        "winter",
        "dim",
        "nord",
        "sunset",
    ]

    // This useEffect will run initially, check for saved theme. Allows for theme persistence across reloads using localStorage
    useEffect(() => {
        // Get theme from local storage, if none exists, choose "dark"
        const savedTheme = localStorage.getItem("theme") ?? "dark";
        // take that saved theme and apply it to our <body> element
        document.body.setAttribute("data-theme", savedTheme);
    }, []);

    const changeTheme = (theme: string) => {
        // modify the <body> so that we can add the "data-theme" attribute -> <HTML "data-theme"=theme...>
        document.body.setAttribute("data-theme", theme);
        // store our selected theme into basic local storage for retrieval
        localStorage.setItem("theme", theme);
    }

    return(
        <div>
            {themes.map((theme: string) => (
                <button key={theme} className={"btn btn-primary btn-sm"} onClick={() => changeTheme(theme)}>
                    {theme}
                </button>
            ))}
        </div>
    );
}

export default ThemeSwitcher;