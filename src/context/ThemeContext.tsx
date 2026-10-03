import React, { createContext, useContext, useState, useEffect } from 'react';

export type ContrastTheme = 
  | 'bright-auto'            // Automatic Bright Theme (Daylight Adaptive - Default)
  | 'dark'                   // Modern Dark Theme (Clean, modern dark theme appearance)
  | 'bright-solar'           // Savannah Sunlit Amber Mode (Warm anti-glare sunlight)
  | 'light-clean'            // Clean Daylight Mode (Crisp Cool Slate)
  | 'bright-large-print'     // Sight-Assist Large Print Bright Mode (Enhanced scale & clarity)
  | 'bright-high-contrast';  // Backward-compatible alias for Dark Theme

export interface ThemeOption {
  id: ContrastTheme;
  name: string;
  badge: string;
  bgHex: string;
  accentHex: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'bright-auto',
    name: 'Automatic Bright Mode',
    badge: 'Auto Bright',
    bgHex: '#faf7f2',
    accentHex: '#b45309',
    description: 'Daylight-optimized natural bright theme with clean contrast for effortless reading.',
  },
  {
    id: 'dark',
    name: 'Modern Dark Theme',
    badge: 'Dark Theme',
    bgHex: '#0b0f19',
    accentHex: '#f59e0b',
    description: 'Clean, modern dark-theme appearance with high-contrast text, sleek slate surfaces, and vibrant amber accents.',
  },
  {
    id: 'bright-solar',
    name: 'Savannah Sunlit Amber',
    badge: 'Sunlit Amber',
    bgHex: '#fef08a',
    accentHex: '#d97706',
    description: 'Warm luminous yellow background with golden surfaces and amber highlights.',
  },
  {
    id: 'light-clean',
    name: 'Clean Daylight Slate',
    badge: 'Cool Slate',
    bgHex: '#e2e8f0',
    accentHex: '#0f766e',
    description: 'Cool crisp slate background with pure white surfaces and deep teal highlights.',
  },
  {
    id: 'bright-large-print',
    name: 'Sight-Assist Large Print',
    badge: 'Large Print',
    bgHex: '#e0f2fe',
    accentHex: '#0284c7',
    description: 'Enlarged 125% typography, larger buttons, and sky blue accents for low-vision clarity.',
  },
];

interface ThemeContextType {
  contrastTheme: ContrastTheme;
  setContrastTheme: (theme: ContrastTheme) => void;
  isDark: boolean;
  themeOptions: ThemeOption[];
  currentThemeOption: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = 'zawadi_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contrastTheme, setContrastThemeState] = useState<ContrastTheme>(() => {
    try {
      const stored = (localStorage.getItem(THEME_STORAGE_KEY) ||
        localStorage.getItem('jitu_contrast_theme')) as ContrastTheme | null;
      if (stored === 'bright-high-contrast') {
        return 'dark';
      }
      if (stored && THEME_OPTIONS.some((t) => t.id === stored)) {
        return stored;
      }
    } catch {
      // default
    }
    return 'bright-auto';
  });

  const setContrastTheme = (theme: ContrastTheme) => {
    const resolved = theme === 'bright-high-contrast' ? 'dark' : theme;
    setContrastThemeState(resolved);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolved);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  const isDark = contrastTheme === 'dark' || contrastTheme === 'bright-high-contrast';

  useEffect(() => {
    const root = document.documentElement;
    // Remove all previous themes
    root.classList.remove(
      'dark',
      'theme-dark',
      'theme-dark-obsidian',
      'theme-dark-high-contrast',
      'theme-dark-midnight',
      'theme-dark-espresso',
      'theme-light-clean',
      'theme-bright-solar',
      'theme-bright-auto',
      'theme-bright-high-contrast',
      'theme-bright-large-print'
    );

    if (isDark) {
      root.classList.add('dark', 'theme-dark');
      document.body.style.backgroundColor = '#0b0f19';
    } else {
      root.classList.remove('dark');
      root.classList.add(`theme-${contrastTheme}`);
      const opt = THEME_OPTIONS.find((t) => t.id === contrastTheme) || THEME_OPTIONS[0];
      document.body.style.backgroundColor = opt.bgHex;
    }
  }, [contrastTheme, isDark]);

  const currentThemeOption =
    THEME_OPTIONS.find((t) => t.id === contrastTheme) ||
    (contrastTheme === 'bright-high-contrast' ? THEME_OPTIONS[1] : THEME_OPTIONS[0]);

  return (
    <ThemeContext.Provider
      value={{
        contrastTheme: contrastTheme === 'bright-high-contrast' ? 'dark' : contrastTheme,
        setContrastTheme,
        isDark,
        themeOptions: THEME_OPTIONS,
        currentThemeOption,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
