import React from 'react';
import { PauseCircle, Trash2 } from 'lucide-react';

interface ListingStatusBadgeProps {
  status: 'ACTIVE' | 'PAUSED' | 'REMOVED' | string;
  size?: 'sm' | 'md';
}

export const ListingStatusBadge: React.FC<ListingStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'ACTIVE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active & Rentable</span>
        </span>
      );
    case 'PAUSED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <PauseCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>Paused by You</span>
        </span>
      );
    case 'REMOVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Trash2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>Removed</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
          {status}
        </span>
      );
  }
};
