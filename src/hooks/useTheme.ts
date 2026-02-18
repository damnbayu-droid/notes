import { useEffect, useState, useCallback } from "react"

type Theme = "dark" | "light" | "system"

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(
        () => (localStorage.getItem("vite-ui-theme") as Theme) || "light"
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    const setTheme = useCallback((newTheme: Theme) => {
        localStorage.setItem("vite-ui-theme", newTheme)
        setThemeState(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState(prev => {
            const newTheme = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem("vite-ui-theme", newTheme);
            return newTheme;
        });
    }, []);

    return {
        theme,
        setTheme,
        toggleTheme,
    }
}
