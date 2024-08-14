import useThemeSwitcher from "../hooks/useThemeSwitcher.ts";

const themes: readonly string[] = [
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

const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


const ThemeSwitcher = () => {

    const {
        currentTheme,
        changeTheme,
    } = useThemeSwitcher(themes);


    return(
        <div>
            <h2>Currently Selected Theme: {capitalizeFirstLetter(currentTheme)}</h2>
            {themes.map((theme: string) => (
                <button key={theme} className={"btn btn-primary btn-sm"} onClick={() => changeTheme(theme)} aria-label={`Switch to ${capitalizeFirstLetter(theme)} theme`}>
                    {capitalizeFirstLetter(theme)}
                </button>
            ))}
        </div>
    );
}

export default ThemeSwitcher;