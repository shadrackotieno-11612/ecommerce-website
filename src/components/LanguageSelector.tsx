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
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 transition shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Select Language / Chagua Lugha"
      >
        <span className="text-base leading-none">{currentLanguageInfo.flag}</span>
        {!compact && (
          <span className="font-semibold text-stone-700">
            {currentLanguageInfo.nativeName}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl bg-white border border-stone-100 ring-1 ring-black/5 divide-y divide-stone-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 bg-stone-50 rounded-t-2xl">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
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
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer ${
                    isSelected ? 'bg-emerald-50/70 font-bold text-emerald-800' : 'text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{lang.flag}</span>
                    <div>
                      <div className="font-medium leading-snug">{lang.nativeName}</div>
                      <div className="text-xs text-stone-600">{lang.name}</div>
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
