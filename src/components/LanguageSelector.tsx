import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/index.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { SupportedLanguage } from '../types/index.ts';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, languages, currentLanguageInfo } = useI18n();
  const { user, updateLanguage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    if (user) {
      updateLanguage(lang);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-theme-surface hover:bg-theme-elevated border-2 border-theme-border text-theme-text transition shadow-xs focus:outline-hidden cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Select Language / Chagua Lugha"
      >
        <span className="text-base leading-none">{currentLanguageInfo.flag}</span>
        {!compact && (
          <span className="font-semibold text-theme-text">
            {currentLanguageInfo.nativeName}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-theme-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl bg-theme-surface border-2 border-theme-border divide-y divide-theme-border z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-theme-text">
          <div className="px-3 py-2 bg-theme-elevated rounded-t-2xl">
            <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-theme-accent" />
              Supported Languages (6)
            </p>
          </div>
          <div className="py-1">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition hover:bg-theme-elevated cursor-pointer ${
                    isSelected ? 'bg-theme-elevated font-black text-theme-accent border-l-4 border-theme-accent' : 'text-theme-text'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{lang.flag}</span>
                    <div>
                      <div className="font-bold leading-snug">{lang.nativeName}</div>
                      <div className="text-xs text-theme-muted">{lang.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
