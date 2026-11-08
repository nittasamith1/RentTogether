import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const collegeName = user?.college_name || 'Aditya University';

  // Time filter state
  const [timeRange, setTimeRange] = useState<'WEEKLY' | 'MONTHLY' | 'SEMESTER'>('WEEKLY');
  const [selectedWeek, setSelectedWeek] = useState<number>(5);

  // Weekly data for Earnings vs Spending
  const weeklyData = [
    { label: 'W1', earnings: 220, spending: 80, date: 'Oct 01 - Oct 07' },
    { label: 'W2', earnings: 490, spending: 160, date: 'Oct 08 - Oct 14' },
    { label: 'W3', earnings: 810, spending: 290, date: 'Oct 15 - Oct 21' },
    { label: 'W4', earnings: 1180, spending: 390, date: 'Oct 22 - Oct 28' },
    { label: 'W5', earnings: 1540, spending: 510, date: 'Oct 29 - Nov 04' },
    { label: 'W6', earnings: 1840, spending: 620, date: 'Nov 05 - Nov 11' },
  ];

  // Category breakdown
  const categoryStats = [
    { name: 'Electronics & Calculators', percentage: 48, earned: '₹880', color: 'bg-[#7563D9]' },
    { name: 'Engineering Textbooks', percentage: 26, earned: '₹480', color: 'bg-[#42A879]' },
    { name: 'Photography & Media', percentage: 16, earned: '₹300', color: 'bg-[#E8A447]' },
    { name: 'Lab Gear & Drafting Kits', percentage: 10, earned: '₹180', color: 'bg-[#F28B82]' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto pb-12 select-none pt-4"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2" style={{ borderBottom: '1px solid #EAE6E1' }}>
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 border"
            style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
            <span>Campus Intelligence & Financials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: '#303653' }}>
            Analytics & Impact Overview
          </h1>
          <p className="text-xs mt-1" style={{ color: '#85899B' }}>
            Personal financial metrics, peer lending performance, and sustainability footprint at {collegeName}.
          </p>
        </div>

        {/* Time Filter Pill */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl shadow-xs self-start sm:self-auto border"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          {(['WEEKLY', 'MONTHLY', 'SEMESTER'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === range
                  ? 'text-white shadow-xs'
                  : 'hover:text-[#7563D9]'
              }`}
              style={{
                backgroundColor: timeRange === range ? '#7563D9' : 'transparent',
                color: timeRange === range ? '#ffffff' : '#85899B',
              }}
            >
              {range.charAt(0) + range.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Analytics Cards — Pastel Backgrounds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Earnings — Fresh Mint */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-xs text-white" style={{ backgroundColor: '#42A879' }}>
              ₹
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ backgroundColor: '#B8E5CC', color: '#2D7A5B' }}
            >
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              +28%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Total Lending Earnings</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#42A879' }}>₹1,840</div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>From 7 active listings</span>
          </div>
        </div>

        {/* Card 2: Total Spending — Soft Peach */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white" style={{ backgroundColor: '#C45C20' }}>
              <CreditCard className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#F5CDB8', color: '#C45C20' }}
            >
              3 rentals
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Total Rental Expenses</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#303653' }}>₹620</div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Scientific calculator, drafter, coat</span>
          </div>
        </div>

        {/* Card 3: Total Saved vs Buying New — Soft Lavender */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white" style={{ backgroundColor: '#7563D9' }}>
              <PiggyBank className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#D8D0F5', color: '#7563D9' }}
            >
              ~87% saved
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Estimated Cost Savings</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#7563D9' }}>₹8,450</div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Compared to new retail purchases</span>
          </div>
        </div>

        {/* Card 4: Net Student Cashflow — Sky Blue */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white" style={{ backgroundColor: '#6398D6' }}>
              <TrendingUp className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#C5DCFA', color: '#3A6BB5' }}
            >
              Net Positive
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Net Campus Cashflow</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#6398D6' }}>+₹1,220</div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Earnings exceed rental costs</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Visualizations: Earnings vs Spending + Sustainability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Earnings vs Spending Area Chart (8 columns) */}
        <div
          className="lg:col-span-8 rounded-2xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: '#303653' }}>
              Earnings vs Spending
            </h2>

            {/* Legend: Earnings (Indigo) & Spending (Soft Coral) */}
            <div className="flex items-center gap-4 text-xs font-medium" style={{ color: '#85899B' }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7563D9' }} />
                <span>Earnings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F28B82' }} />
                <span>Spending</span>
              </div>
            </div>
          </div>

          {/* Dual Spline SVG Chart */}
          <div className="relative h-56 sm:h-64 w-full flex items-end pt-2 pb-1">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 600 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="earningsGradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7563D9" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#9B8EE3" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#FFF8ED" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="spendingGradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F28B82" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#FFF8ED" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="20" y1="90" x2="580" y2="90" stroke="#EAE6E1" strokeWidth="1" strokeDasharray="5 5" />
              <line x1="20" y1="175" x2="580" y2="175" stroke="#EAE6E1" strokeWidth="1" />

              {/* Area under Curves */}
              <path
                d="M 50 145 C 100 138, 120 125, 150 125 C 180 125, 220 105, 250 100 C 280 95, 320 80, 350 78 C 380 75, 420 65, 450 62 C 480 60, 520 50, 550 48 L 550 175 L 50 175 Z"
                fill="url(#earningsGradientArea)"
              />
              <path
                d="M 50 155 C 100 150, 120 145, 150 145 C 180 145, 220 138, 250 136 C 280 134, 320 130, 350 130 C 380 130, 420 126, 450 124 C 480 122, 520 115, 550 110 L 550 175 L 50 175 Z"
                fill="url(#spendingGradientArea)"
              />

              {/* Strokes */}
              <path
                d="M 50 145 C 100 138, 120 125, 150 125 C 180 125, 220 105, 250 100 C 280 95, 320 80, 350 78 C 380 75, 420 65, 450 62 C 480 60, 520 50, 550 48"
                fill="none"
                stroke="#7563D9"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 50 155 C 100 150, 120 145, 150 145 C 180 145, 220 138, 250 136 C 280 134, 320 130, 350 130 C 380 130, 420 126, 450 124 C 480 122, 520 115, 550 110"
                fill="none"
                stroke="#F28B82"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Dots */}
              <circle cx="50" cy="155" r="4" fill="#F28B82" />
              <circle cx="150" cy="145" r="4" fill="#F28B82" />
              <circle cx="250" cy="136" r="4" fill="#F28B82" />
              <circle cx="350" cy="130" r="4" fill="#F28B82" />
              <circle cx="450" cy="124" r="4" fill="#F28B82" />
              <circle cx="550" cy="110" r="4.5" fill="#F28B82" />

              <circle cx="50" cy="145" r="4.5" fill="#7563D9" />
              <circle cx="150" cy="133" r="4.5" fill="#7563D9" />
              <circle cx="250" cy="100" r="4.5" fill="#7563D9" />
              <circle cx="350" cy="85" r="4.5" fill="#7563D9" />
              <circle cx="450" cy="62" r="6" fill="#7563D9" stroke="#FFFFFF" strokeWidth="2.5" />
              <circle cx="550" cy="48" r="5" fill="#7563D9" />
            </svg>
          </div>

          {/* Timeline Axis */}
          <div className="grid grid-cols-6 text-center text-xs sm:text-sm font-medium pt-3 items-center">
            {weeklyData.map((d, index) => {
              const isSelected = selectedWeek === index;
              return (
                <div key={d.label} className="flex justify-center">
                  <button
                    onClick={() => setSelectedWeek(index)}
                    className="transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? '#E9E3FF' : 'transparent',
                      color: isSelected ? '#7563D9' : '#85899B',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      padding: isSelected ? '4px 16px' : '4px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {d.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sustainability Ring Gauge (4 columns) */}
        <div
          className="lg:col-span-4 rounded-2xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between items-center text-center"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="w-full flex items-center justify-between pb-1">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-left" style={{ color: '#303653' }}>
              Sustainability
            </h2>
          </div>

          <div className="my-auto py-6 sm:py-8 flex flex-col items-center justify-center">
            <div
              className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full flex items-center justify-center p-3.5 shadow-xs"
              style={{ backgroundColor: '#DDF3E7' }}
            >
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ border: '9px solid #B8E5CC' }}
              />

              <div
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full text-white flex flex-col items-center justify-center shadow-lg"
                style={{ backgroundColor: '#42A879' }}
              >
                <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                  18 kg
                </span>
                <span className="text-xs sm:text-sm font-medium text-white/95 mt-1 leading-tight">
                  CO₂ avoided
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm font-normal text-center max-w-xs mt-2" style={{ color: '#85899B' }}>
            12 items reused instead of bought new. Nice work!
          </p>
        </div>
      </div>

      {/* Category Breakdown & Campus Trust */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Category Share (7 cols) */}
        <div
          className="lg:col-span-7 rounded-2xl p-6 border shadow-sm space-y-4"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#303653' }}>Rental Activity by Category</h3>
              <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>Distribution of your resource rentals across departments.</p>
            </div>
            <Layers className="w-4 h-4" style={{ color: '#85899B' }} />
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold" style={{ color: '#303653' }}>{cat.name}</span>
                  <span className="font-mono font-bold" style={{ color: '#7563D9' }}>{cat.earned} ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#FFF8ED', border: '1px solid #EAE6E1' }}>
                  <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Trust & Badges (5 cols) */}
        <div
          className="lg:col-span-5 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#303653' }}
        >
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Campus Trust Rating
            </span>
            <Award className="w-5 h-5" style={{ color: '#E8A447' }} />
          </div>

          <div className="my-auto py-2">
            <div className="text-3xl font-black" style={{ color: '#E8A447' }}>4.9 / 5.0</div>
            <div className="text-xs font-medium mt-1 text-white/90">
              Top Rated Lender at {collegeName}
            </div>
            <p className="text-[11px] mt-2 leading-relaxed text-white/70">
              Based on 28 on-time returns and verified condition checks by verified peers.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-white/80" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <span>Verified Student ID</span>
            <span className="font-bold font-mono" style={{ color: '#42A879' }}>100% On-Time Returns</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
