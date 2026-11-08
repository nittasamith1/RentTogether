import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface CampusNetworkCardProps {
  collegeName?: string;
  collegeCode?: string;
  className?: string;
}

export const CampusNetworkCard: React.FC<CampusNetworkCardProps> = ({
  collegeName = 'Aditya University',
  collegeCode = 'ADITYA',
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3.5 border ${className}`}
      style={{ backgroundColor: '#7563D9', borderColor: '#6552C5' }}
    >
      {/* Soft decorative circle */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 pointer-events-none"
        style={{ backgroundColor: '#fff' }}
      />

      {/* Top row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[11px] font-semibold text-white/90 tracking-wide">
            Single-Campus Network
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.5 rounded-full">
          <ShieldCheck className="w-2.5 h-2.5 stroke-[2.5]" />
          Verified
        </span>
      </div>

      {/* College name */}
      <div className="relative z-10 mt-2.5">
        <div className="text-xs font-black tracking-tight text-white flex items-center justify-between">
          <span>{collegeName}</span>
          <span className="text-[10px] font-mono font-bold text-white/60">{collegeCode}</span>
        </div>
        <p className="text-[10px] text-white/60 font-medium leading-tight mt-0.5">
          Intra-campus rentals only
        </p>
      </div>

      {/* Tagline */}
      <div className="relative z-10 mt-2.5 pt-2 flex items-center justify-between text-[10px]" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <span className="font-bold text-white/90 tracking-tight">Share Smart.</span>
        <span className="text-white/60 font-medium">Save More.</span>
      </div>
    </div>
  );
};
