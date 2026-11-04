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
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071329] via-[#0B1E3F] to-[#11244E] text-white p-3.5 border border-slate-800/90 shadow-lg shadow-slate-950/20 group hover:border-indigo-500/40 transition-all duration-300 ${className}`}
    >
      {/* Top Header Row matching user's reference badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Animated pulsing green indicator */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold text-slate-200 tracking-wide">
            Single-Campus Network
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
          <ShieldCheck className="w-2.5 h-2.5 stroke-[2.5]" />
          Verified
        </span>
      </div>

      {/* College Identity */}
      <div className="relative z-10 mt-2">
        <div className="text-xs font-black tracking-tight text-white flex items-center justify-between">
          <span>{collegeName}</span>
          <span className="text-[10px] font-mono font-bold text-indigo-300">
            {collegeCode}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
          Intra-campus rentals only
        </p>
      </div>

      {/* Subtle Divider & Tagline */}
      <div className="relative z-10 mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
        <span className="font-bold text-[#FB7185] tracking-tight">
          Share Smart.
        </span>
        <span className="text-slate-400 font-medium">
          Save More.
        </span>
      </div>

      {/* Elegant Curved Wave Swoosh matching user's graphic 1:1 */}
      <svg
        className="absolute -bottom-1 -left-1 -right-1 w-[105%] h-8 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity duration-300"
        viewBox="0 0 200 40"
        fill="none"
        preserveAspectRatio="none"
      >
        {/* Deep Royal Blue Wave */}
        <path
          d="M0 24 C50 12, 110 36, 200 18 L200 40 L0 40 Z"
          fill="#1D4ED8"
          opacity="0.8"
        />
        {/* Vibrant Crimson Red Curve */}
        <path
          d="M0 30 C35 22, 75 36, 130 26 L130 40 L0 40 Z"
          fill="#DC2626"
          opacity="0.9"
        />
      </svg>
    </div>
  );
};
