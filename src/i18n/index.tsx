import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LanguageInfo } from '../types/index.ts';
import { en } from './translations/en.ts';
import { sw } from './translations/sw.ts';
import { lg } from './translations/lg.ts';
import { zh } from './translations/zh.ts';
import { es } from './translations/es.ts';
import { pt } from './translations/pt.ts';

const translationsMap: Record<SupportedLanguage, typeof en> = {
  en,
  sw,
  lg,
  zh,
  es,
  pt,
};

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: typeof en;
  languages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
  translateField: (fieldRecord?: Record<SupportedLanguage, string> | Record<string, string>) => string;
  formatPrice: (amount: number) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'zawadi_preferred_lang';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (stored && ['en', 'sw', 'lg', 'zh', 'es', 'pt'].includes(stored)) {
        return stored;
      }
      // Check browser language
      const browserLang = navigator.language?.slice(0, 2);
      if (browserLang === 'sw') return 'sw';
      if (browserLang === 'zh') return 'zh';
      if (browserLang === 'es') return 'es';
      if (browserLang === 'pt') return 'pt';
      if (browserLang === 'lg') return 'lg';
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `zawadi_lang=${lang};path=/;max-age=31536000;SameSite=Lax`;
    } catch (e) {
      console.warn('Could not persist language to storage:', e);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const currentDict = translationsMap[language] || en;

  const currentLanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const translateField = (
    fieldRecord?: Record<SupportedLanguage, string> | Record<string, string>
  ): string => {
    if (!fieldRecord) return '';
    return fieldRecord[language] || fieldRecord['en'] || Object.values(fieldRecord)[0] || '';
  };

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t: currentDict,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageInfo,
        translateField,
        formatPrice,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
