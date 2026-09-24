import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      role="button"
      tabIndex={0}
      aria-label="TS Social Book Home"
    >
      {/* Original Geometric TS Mark */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 shadow-md shadow-blue-500/25 text-white font-extrabold transition-transform duration-200 group-hover:scale-105 overflow-hidden`}
      >
        {/* Subtle decorative grid/book overlay */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]" />
        
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4 text-white drop-shadow-sm"
        >
          {/* Stylized Open Book & Connected TS nodes */}
          <path
            d="M5 8C5 6.89543 5.89543 6 7 6H14C15.1046 6 16 6.89543 16 8V24C16 24 13.5 22 7 22C5.89543 22 5 22.8954 5 24V8Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          <path
            d="M27 8C27 6.89543 26.1046 6 25 6H18C16.8954 6 16 6.89543 16 8V24C16 24 18.5 22 25 22C26.1046 22 27 22.8954 27 24V8Z"
            fill="currentColor"
            fillOpacity="0.95"
          />
          <circle cx="16" cy="11" r="2.5" fill="#38bdf8" />
          <path
            d="M12 11H20"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M16 11V18"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black tracking-tight ${textSizes[size]} text-slate-900 dark:text-white flex items-center gap-1`}>
            <span className="text-blue-600 dark:text-blue-400">TS</span>
            <span>Social</span>
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">Book</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 dark:text-slate-400 mt-0.5">
            Network & Connect
          </span>
        </div>
      )}
    </div>
  );
};
