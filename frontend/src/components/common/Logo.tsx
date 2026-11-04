import React from 'react';
import logoIcon from '../../assets/logo_icon.png';

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
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Authentic Interlocking Rings Logo Mark */}
      <img
        src={logoIcon}
        alt="RentTogether Logo"
        className={`${iconSizes[size]} object-contain shrink-0 drop-shadow-md transition-transform duration-200`}
        draggable={false}
      />

      {/* Brand Typography: Bold, Crisp, High-Contrast */}
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
