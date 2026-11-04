import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
  };

  const svgSizes = {
    sm: 'w-4.5 h-4.5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Icon: Vibrant Purple Squircle with White Interlocking Chain Link */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-tr from-[#5046E5] via-[#5B4DFF] to-[#6945F7] flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0 transition-transform`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${svgSizes[size]} text-white`}
        >
          {/* Left Loop */}
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          {/* Right Loop */}
          <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
          {/* Connecting Bridge */}
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>

      {/* Brand Typography: Bold, Crisp, Perfectly Sized */}
      {showText && (
        <span
          className={`${textSizes[size]} font-black tracking-tight text-[#1E1B4B] leading-none flex items-center`}
        >
          RentTogether
        </span>
      )}
    </div>
  );
};
