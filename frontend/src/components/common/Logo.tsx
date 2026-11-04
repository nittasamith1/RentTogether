import React from 'react';
import logoImg from '../../assets/logo_transparent.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const heightClass =
    size === 'sm' ? 'h-7' : size === 'lg' ? 'h-11' : 'h-8 sm:h-9';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={logoImg}
        alt="RentTogether"
        className={`${heightClass} w-auto object-contain`}
        draggable={false}
      />
    </div>
  );
};
