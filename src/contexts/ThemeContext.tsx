import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemePreset = 'neutro' | 'cards' | 'sections' | 'full-red';

interface ThemeContextType {
  theme: ThemePreset;
  setTheme: (preset: ThemePreset) => void;
}

const THEME_KEY = 'app_theme';

const CLASS_MAP: Record<ThemePreset, string> = {
  neutro: '',
  cards: 'theme-cards',
  sections: 'theme-sections',
  'full-red': 'theme-full-red',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'neutro',
  setTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as ThemePreset) || 'neutro';
    } catch {
      return 'neutro';
    }
  });

  const applyTheme = useCallback((preset: ThemePreset) => {
    const root = document.documentElement;
    // Remove all theme classes
    Object.values(CLASS_MAP).forEach(cls => {
      if (cls) root.classList.remove(cls);
    });
    // Add new theme class
    const cls = CLASS_MAP[preset];
    if (cls) root.classList.add(cls);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((preset: ThemePreset) => {
    setThemeState(preset);
    try {
      localStorage.setItem(THEME_KEY, preset);
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
