'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('cys-theme') as Theme | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const update = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('cys-theme', newTheme);
  };

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'system', resolvedTheme: 'light', setTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
