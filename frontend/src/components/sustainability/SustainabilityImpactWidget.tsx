import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, RefreshCw, Trees, Sparkles, TrendingUp } from 'lucide-react';
import { StudentImpactResponse } from '../../services/sustainabilityService';

interface SustainabilityImpactWidgetProps {
  impact: StudentImpactResponse | undefined;
  isLoading?: boolean;
}

export const SustainabilityImpactWidget: React.FC<SustainabilityImpactWidgetProps> = ({
  impact,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div
        className="rounded-3xl p-6 border shadow-xs animate-pulse space-y-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="h-6 w-48 bg-neutral-200 rounded-lg" />
        <div className="h-32 bg-neutral-100 rounded-2xl" />
      </div>
    );
  }

  const percentile = impact?.contribution_percentile ?? 0;
  const moneySaved = impact?.money_saved_inr ?? 0;
  const resourcesReused = impact?.completed_rentals ?? 0;
  const wasteAvoided = impact?.waste_avoided_kg ?? 0;
  const co2Saved = impact?.co2_saved_kg ?? (wasteAvoided > 0 ? Math.round(wasteAvoided * 2.1 * 10) / 10 : 0);
  const treesEquivalent = impact?.trees_equivalent ?? (co2Saved > 0 ? Math.round((co2Saved / 21) * 10) / 10 : 0);

  // Donut SVG circumference calculation (radius = 42)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentile / 100) * circumference;

  return (
    <div
      className="rounded-3xl p-6 border shadow-xs flex flex-col justify-between relative overflow-hidden"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#EAE6E1' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
            style={{ backgroundColor: '#DDF3E7', color: '#42A879' }}
          >
            <Leaf className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: '#303653' }}>
              <span>Campus Sustainability Impact</span>
              <Sparkles className="w-3.5 h-3.5 text-[#E8A447]" />
            </h3>
            <p className="text-xs" style={{ color: '#85899B' }}>
              Ecological savings from campus circular resource sharing
            </p>
          </div>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC', color: '#2D7A5B' }}
        >
          <TrendingUp className="w-3 h-3" />
          <span>Eco-Verified</span>
        </span>
      </div>

      {/* Main Content: Donut Chart on Left, Summary Metrics on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-5">
        {/* Donut Chart (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#EAE6E1"
                strokeWidth="9"
                fill="transparent"
              />
              {/* Progress Ring with Gradient */}
              <defs>
                <linearGradient id="sustainabilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#42A879" />
                  <stop offset="100%" stopColor="#7563D9" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                stroke="url(#sustainabilityGradient)"
                strokeWidth="9"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-2">
              <span className="text-2xl font-black tracking-tight leading-none" style={{ color: '#303653' }}>
                {percentile}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-tight text-[#85899B] mt-1 leading-tight text-center max-w-[85px]">
                Your Contribution
              </span>
            </div>
          </div>

          <p className="text-[11px] font-medium text-center mt-2" style={{ color: '#85899B' }}>
            Top tier impact across your campus network
          </p>
        </div>

        {/* Summary List Metrics (7 cols) */}
        <div className="md:col-span-7 space-y-2.5">
          {/* Metric 1: Total Money Saved */}
          <div
            className="p-3 rounded-2xl border flex items-center justify-between transition-all"
            style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs"
                style={{ backgroundColor: '#FFE5D6', color: '#C45C20' }}
              >
                ₹
              </div>
              <div>
                <span className="text-[10px] font-semibold block uppercase tracking-wider" style={{ color: '#85899B' }}>
                  Total Money Saved
                </span>
                <span className="text-sm font-extrabold" style={{ color: '#303653' }}>
                  ₹{moneySaved.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold" style={{ color: '#42A879' }}>
              vs buying new
            </span>
          </div>

          {/* Metric 2: Resources Reused */}
          <div
            className="p-3 rounded-2xl border flex items-center justify-between transition-all"
            style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: '#7563D9' }}
              >
                <RefreshCw className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold block uppercase tracking-wider" style={{ color: '#85899B' }}>
                  Resources Reused
                </span>
                <span className="text-sm font-extrabold" style={{ color: '#303653' }}>
                  {resourcesReused} completed {resourcesReused === 1 ? 'rental' : 'rentals'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold" style={{ color: '#7563D9' }}>
              Circular sharing
            </span>
          </div>

          {/* Metric 3: Estimated Waste Avoided */}
          <div
            className="p-3 rounded-2xl border flex items-center justify-between transition-all"
            style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: '#42A879' }}
              >
                <Leaf className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold block uppercase tracking-wider" style={{ color: '#85899B' }}>
                  Estimated Waste Reduced
                </span>
                <span className="text-sm font-extrabold" style={{ color: '#303653' }}>
                  {wasteAvoided} kg embodied waste
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold" style={{ color: '#42A879' }}>
              ~{co2Saved} kg CO₂e
            </span>
          </div>

          {/* Metric 4: Trees Equivalent */}
          <div
            className="p-3 rounded-2xl border flex items-center justify-between transition-all"
            style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: '#2D7A5B' }}
              >
                <Trees className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold block uppercase tracking-wider" style={{ color: '#85899B' }}>
                  Carbon Absorption Equivalent
                </span>
                <span className="text-sm font-extrabold" style={{ color: '#303653' }}>
                  {treesEquivalent} {treesEquivalent === 1 ? 'tree' : 'trees'} per year
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold" style={{ color: '#2D7A5B' }}>
              Green Campus
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
