import React from 'react';

interface LionLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const LionLogo: React.FC<LionLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizeClass = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  }[size];

  const titleClass = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  }[size];

  const subClass = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* Lion Emblem SVG */}
      <div
        className={`${iconSizeClass} shrink-0 rounded-2xl p-1.5 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all duration-300 ring-1 ring-amber-300/40`}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Lion Mane Strands (Outer) */}
          <path
            d="M50 8 L58 20 L72 14 L75 28 L89 28 L86 42 L96 48 L87 58 L93 70 L80 74 L81 88 L68 85 L62 96 L50 88 L38 96 L32 85 L19 88 L20 74 L7 70 L13 58 L4 48 L14 42 L11 28 L25 28 L28 14 L42 20 Z"
            fill="#1c1917"
          />
          {/* Inner Mane Geometric Accents */}
          <path
            d="M50 16 L56 26 L68 22 L69 34 L80 35 L76 46 L85 52 L77 60 L81 70 L70 72 L69 82 L59 79 L53 88 L50 81 L47 88 L41 79 L31 82 L30 72 L19 70 L23 60 L15 52 L24 46 L20 35 L31 34 L32 22 L44 26 Z"
            fill="#f59e0b"
          />
          {/* Lion Face Contour */}
          <path
            d="M50 26 C37 26 31 36 31 49 C31 63 40 73 50 77 C60 73 69 63 69 49 C69 36 63 26 50 26 Z"
            fill="#1c1917"
          />
          {/* Crown / Forehead Marking */}
          <path
            d="M45 28 L50 22 L55 28 L50 32 Z"
            fill="#fbbf24"
          />
          <path
            d="M40 32 L50 38 L60 32 L50 35 Z"
            fill="#fbbf24"
          />
          {/* Piercing Lion Eyes */}
          <polygon points="37,45 45,47 43,51 36,48" fill="#fbbf24" />
          <polygon points="63,45 55,47 57,51 64,48" fill="#fbbf24" />
          <circle cx="41" cy="48" r="1.5" fill="#1c1917" />
          <circle cx="59" cy="48" r="1.5" fill="#1c1917" />
          {/* Nose & Muzzle */}
          <polygon points="50,56 45,62 55,62" fill="#d97706" />
          <path
            d="M50 62 L50 68 M45 66 C47 68 50 68 50 68 C50 68 53 68 55 66"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Whiskers */}
          <line x1="33" y1="62" x2="43" y2="64" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="67" x2="42" y2="67" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="67" y1="62" x2="57" y2="64" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="68" y1="67" x2="58" y2="67" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Writing */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center leading-none">
            <span
              className={`font-black tracking-tight text-stone-950 font-['Outfit',sans-serif] ${titleClass} group-hover:text-amber-600 transition-colors`}
            >
              ZAWADI <span className="text-amber-600">KENYA</span>
            </span>
          </div>
          <span className={`text-stone-600 font-bold tracking-wide uppercase ${subClass} mt-0.5`}>
            Authentic Goods & Services
          </span>
        </div>
      )}
    </div>
  );
};
