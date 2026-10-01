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
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-stone-950 border-2 border-stone-300 hover:border-amber-500 transition cursor-pointer shadow-xs"
        aria-expanded={isOpen}
        title="Change Contrast & Theme / Badilisha Mandhari"
      >
        <div
          className="w-3.5 h-3.5 rounded-full border border-stone-400 shrink-0"
          style={{ backgroundColor: currentThemeOption.bgHex }}
        ></div>
        {!compact && (
          <span className="hidden sm:inline font-bold text-black">
            {currentThemeOption.badge}
          </span>
        )}
        <SunMoon className="w-3.5 h-3.5 text-amber-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl bg-white border-2 border-stone-200 divide-y divide-stone-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-stone-900">
          <div className="px-3.5 py-2.5 bg-stone-50 rounded-t-2xl">
            <p className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-500" />
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition hover:bg-stone-50 cursor-pointer ${
                    isSelected ? 'bg-amber-50/80 font-bold border-l-4 border-amber-500 text-stone-950' : 'text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full border border-stone-400 shrink-0 shadow-xs"
                      style={{ backgroundColor: opt.bgHex, borderColor: opt.accentHex }}
                    />
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span>{opt.name}</span>
                        {opt.id === 'bright-auto' && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-200 text-amber-900 font-extrabold">
                            Auto
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500">{opt.description}</div>
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
