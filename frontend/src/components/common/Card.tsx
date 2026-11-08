import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`rounded-2xl border shadow-xs transition-shadow p-5 ${className}`}
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      {...props}
    >
      {children}
    </div>
  );
};
