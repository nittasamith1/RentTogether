import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
  fullPage?: boolean;
}

const sizeMap = {
  xs: { ring: 'w-4 h-4', border: 'border-2' },
  sm: { ring: 'w-6 h-6', border: 'border-2' },
  md: { ring: 'w-9 h-9', border: 'border-3' },
  lg: { ring: 'w-12 h-12', border: 'border-3' },
  xl: { ring: 'w-16 h-16', border: 'border-4' },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className = '',
  fullPage = false,
}) => {
  const { ring, border } = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer subtle glow / track */}
        <div
          className={`${ring} ${border} rounded-full animate-spin`}
          style={{
            borderColor: '#E9E3FF',
            borderTopColor: '#7563D9',
            animationDuration: '0.8s',
          }}
        />
        {/* Soft center pulse */}
        <span
          className="absolute w-1.5 h-1.5 rounded-full animate-ping"
          style={{ backgroundColor: '#F28B82' }}
        />
      </div>
      {label && (
        <p className="text-xs font-semibold tracking-wide" style={{ color: '#85899B' }}>
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs"
        style={{ backgroundColor: 'rgba(255, 252, 247, 0.85)' }}
      >
        {content}
      </div>
    );
  }

  return content;
};

