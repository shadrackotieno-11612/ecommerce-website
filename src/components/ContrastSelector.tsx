import React, { useState, useRef, useEffect } from 'react';
import { useTheme, ContrastTheme } from '../context/ThemeContext.tsx';
import { SunMoon, Check, Palette, Sparkles } from 'lucide-react';

export const ContrastSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { contrastTheme, setContrastTheme, themeOptions, currentThemeOption } = useTheme();
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

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-theme-surface text-theme-text border-2 border-theme-border hover:border-theme-accent transition cursor-pointer shadow-xs"
        aria-expanded={isOpen}
        title="Change Contrast & Theme / Badilisha Mandhari"
      >
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-theme-border shrink-0"
          style={{ backgroundColor: currentThemeOption.bgHex }}
        ></div>
        {!compact && (
          <span className="hidden sm:inline font-bold text-theme-text">
            {currentThemeOption.badge}
          </span>
        )}
        <SunMoon className="w-3.5 h-3.5 text-theme-accent" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl bg-theme-surface border-2 border-theme-border divide-y divide-theme-border z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-theme-text">
          <div className="px-3.5 py-2.5 bg-theme-elevated rounded-t-2xl">
            <p className="text-[11px] font-bold text-theme-text uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-theme-accent" />
              Theme & Contrast Modes
            </p>
          </div>
          <div className="py-1 max-h-80 overflow-y-auto">
            {themeOptions.map((opt) => {
              const isSelected = opt.id === contrastTheme;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setContrastTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition hover:bg-theme-elevated cursor-pointer ${
                    isSelected ? 'bg-theme-elevated font-black border-l-4 border-theme-accent text-theme-text' : 'text-theme-muted'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full border-2 shrink-0 shadow-xs"
                      style={{ backgroundColor: opt.bgHex, borderColor: opt.accentHex }}
                    />
                    <div>
                      <div className="font-bold text-theme-text flex items-center gap-1.5">
                        <span>{opt.name}</span>
                        {opt.id === 'bright-auto' && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-theme-elevated text-theme-accent font-extrabold border border-theme-border">
                            Auto
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-theme-muted">{opt.description}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
