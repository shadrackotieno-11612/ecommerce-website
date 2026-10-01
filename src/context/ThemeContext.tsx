import React, { createContext, useContext, useState, useEffect } from 'react';

export type ContrastTheme = 
  | 'bright-auto'            // Automatic Bright Theme (Daylight Adaptive - Default)
  | 'bright-high-contrast'   // Ultra High-Contrast Bright (Pure White, Bold Black Text & Borders for Sight Accessibility)
  | 'bright-solar'           // Savannah Sunlit Amber Mode (Warm anti-glare sunlight)
  | 'light-clean'            // Clean Daylight Mode (Crisp Cool Slate)
  | 'bright-large-print';    // Sight-Assist Large Print Bright Mode (Enhanced scale & clarity)

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
    bgHex: '#fffdf0',
    accentHex: '#d97706',
    description: 'Daylight-optimized bright theme with clear contrast for effortless reading.',
  },
  {
    id: 'bright-high-contrast',
    name: 'High-Contrast Sight Accessibility',
    badge: 'High Contrast',
    bgHex: '#ffffff',
    accentHex: '#b45309',
    description: 'Designed for clients with sight problems: solid black text, pure white background, and bold visible borders.',
  },
  {
    id: 'bright-solar',
    name: 'Savannah Sunlit Amber',
    badge: 'Sunlit Amber',
    bgHex: '#fffbeb',
    accentHex: '#d97706',
    description: 'Warm luminous sunlight background with golden highlights and soft anti-glare contrast.',
  },
  {
    id: 'light-clean',
    name: 'Clean Daylight Slate',
    badge: 'Crisp Light',
    bgHex: '#f8fafc',
    accentHex: '#059669',
    description: 'Cool crisp white daylight background with deep slate typography.',
  },
  {
    id: 'bright-large-print',
    name: 'Sight-Assist Large Print',
    badge: 'Sight Assist',
    bgHex: '#ffffff',
    accentHex: '#0284c7',
    description: 'Enlarged high-visibility typography and pronounced outlines for low-vision accessibility.',
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

const THEME_STORAGE_KEY = 'jitu_contrast_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contrastTheme, setContrastThemeState] = useState<ContrastTheme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ContrastTheme | null;
      // If stored value is one of our accessible bright themes, keep it; otherwise reset to bright-auto
      if (stored && THEME_OPTIONS.some((t) => t.id === stored)) {
        return stored;
      }
    } catch {
      // default
    }
    return 'bright-auto';
  });

  const setContrastTheme = (theme: ContrastTheme) => {
    setContrastThemeState(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove all previous themes and dark class
    root.classList.remove(
      'dark',
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

    // Apply the active accessible bright theme
    root.classList.add(`theme-${contrastTheme}`);

    // Never add 'dark' class - this is exclusively an accessible bright storefront
    root.classList.remove('dark');

    // Set background color directly on body for seamless instant rendering
    const opt = THEME_OPTIONS.find((t) => t.id === contrastTheme) || THEME_OPTIONS[0];
    document.body.style.backgroundColor = opt.bgHex;
  }, [contrastTheme]);

  const currentThemeOption =
    THEME_OPTIONS.find((t) => t.id === contrastTheme) || THEME_OPTIONS[0];

  // Store is always bright and accessible
  const isDark = false;

  return (
    <ThemeContext.Provider
      value={{
        contrastTheme,
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
