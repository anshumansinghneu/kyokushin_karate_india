'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    toggleTheme: () => {},
    setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('kkfi-theme') as Theme | null;
        if (stored === 'light' || stored === 'dark') {
            setThemeState(stored);
            applyTheme(stored);
        }
    }, []);

    const applyTheme = (t: Theme) => {
        const root = document.documentElement;
        if (t === 'light') {
            root.classList.add('light-mode');
            root.classList.remove('dark-mode');
        } else {
            root.classList.remove('light-mode');
            root.classList.add('dark-mode');
        }
    };

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem('kkfi-theme', t);
        applyTheme(t);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
