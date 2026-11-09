import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{
        backgroundColor: '#F3EFEA',
        ...style,
      }}
    />
  );
};

export const ItemCardSkeleton: React.FC = () => {
  return (
    <div
      className="rounded-3xl p-3.5 border flex flex-col gap-3 shadow-xs"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
    >
      {/* Image Skeleton */}
      <div
        className="w-full aspect-4/3 rounded-2xl animate-pulse"
        style={{ backgroundColor: '#EFEAE2' }}
      />
      {/* Category & Badge */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      {/* Title */}
      <Skeleton className="h-5 w-4/5 rounded-md" />
      {/* Owner & Price row */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #F3EFEA' }}>
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
    </div>
  );
};

export const ItemGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-3xl border space-y-3"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="w-12 h-4 rounded-full" />
            </div>
            <Skeleton className="w-24 h-7 rounded-md" />
            <Skeleton className="w-32 h-3 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div
        className="p-6 rounded-3xl border space-y-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <Skeleton className="w-48 h-6 rounded-md" />
        <ItemGridSkeleton count={4} />
      </div>
    </div>
  );
};

