import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { THEME_MODES, THEME_STORAGE_KEY } from '../constants';

const ThemeContext = createContext(null);

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === THEME_MODES.dark || savedTheme === THEME_MODES.light) {
    return savedTheme;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? THEME_MODES.dark : THEME_MODES.light;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === THEME_MODES.dark);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === THEME_MODES.dark ? THEME_MODES.light : THEME_MODES.dark));

  const value = useMemo(
    () => ({ theme, isDark: theme === THEME_MODES.dark, toggleTheme }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
};
