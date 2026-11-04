import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100/80 shadow-soft p-5 transition-shadow hover:shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
