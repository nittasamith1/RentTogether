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
          className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
          style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#42A879' }} />
          <span>Active & Rentable</span>
        </span>
      );
    case 'PAUSED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
          style={{ backgroundColor: '#FFE5D6', color: '#E8A447', borderColor: '#F5CDB8' }}
        >
          <PauseCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>Paused</span>
        </span>
      );
    case 'REMOVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
          style={{ backgroundColor: '#FFF0F0', color: '#E87575', borderColor: '#F28B82' }}
        >
          <Trash2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>Removed</span>
        </span>
      );
    default:
      return (
        <span
          className="inline-flex items-center font-bold px-2 py-0.5 rounded-full text-xs border"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
        >
          {status}
        </span>
      );
  }
};
