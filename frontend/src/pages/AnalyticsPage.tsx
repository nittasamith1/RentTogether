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
  const [selectedWeek, setSelectedWeek] = useState<number>(5); // Default to W6 (index 5) matching screenshot

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
    { name: 'Electronics & Calculators', percentage: 48, earned: '₹880', color: 'bg-[#5B4DFF]' },
    { name: 'Engineering Textbooks', percentage: 26, earned: '₹480', color: 'bg-emerald-500' },
    { name: 'Photography & Media', percentage: 16, earned: '₹300', color: 'bg-amber-500' },
    { name: 'Lab Gear & Drafting Kits', percentage: 10, earned: '₹180', color: 'bg-rose-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto pb-12 select-none"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-[#5B4DFF] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
            <span>Campus Intelligence & Financials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
            Analytics & Impact Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personal financial metrics, peer lending performance, and sustainability footprint at {collegeName}.
          </p>
        </div>

        {/* Time Filter Pill */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs self-start sm:self-auto">
          {(['WEEKLY', 'MONTHLY', 'SEMESTER'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-[#5B4DFF] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {range.charAt(0) + range.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base shadow-xs">
              ₹
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              +28%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Total Lending Earnings</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">₹1,840</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">From 7 active listings</span>
          </div>
        </div>

        {/* Total Spending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
              3 rentals
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Total Rental Expenses</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">₹620</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Scientific calculator, drafter, coat</span>
          </div>
        </div>

        {/* Total Saved vs Buying New */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <PiggyBank className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              ~87% saved
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Estimated Cost Savings</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">₹8,450</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Compared to new retail purchases</span>
          </div>
        </div>

        {/* Net Student Cashflow */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Net Positive
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Net Campus Cashflow</span>
            <div className="text-2xl font-extrabold text-[#5B4DFF] mt-0.5">+₹1,220</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Earnings exceed rental costs</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Visualizations: Earnings vs Spending + Sustainability (Exact User Screenshot Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Earnings vs Spending Area Chart (8 columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between">
          {/* Header matching screenshot */}
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Earnings vs Spending
            </h2>

            {/* Legend: Earnings (Purple) & Spending (Pink/Coral) */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5046E5]" />
                <span>Earnings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
                <span>Spending</span>
              </div>
            </div>
          </div>

          {/* Dual Spline SVG Chart matching user's exact curve, gradient, and scatter points */}
          <div className="relative h-56 sm:h-64 w-full flex items-end pt-2 pb-1">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 600 200"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Purple gradient fading to pink/transparent at the bottom */}
                <linearGradient id="earningsGradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5046E5" stopOpacity="0.28" />
                  <stop offset="60%" stopColor="#818CF8" stopOpacity="0.14" />
                  <stop offset="90%" stopColor="#F472B6" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#FFF1F2" stopOpacity="0.0" />
                </linearGradient>

                {/* Coral/Pink gradient */}
                <linearGradient id="spendingGradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#FB7185" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Middle horizontal dashed guideline */}
              <line
                x1="20"
                y1="90"
                x2="580"
                y2="90"
                stroke="#F1F5F9"
                strokeWidth="1.2"
                strokeDasharray="5 5"
              />

              {/* Bottom solid baseline */}
              <line
                x1="20"
                y1="175"
                x2="580"
                y2="175"
                stroke="#F8FAFC"
                strokeWidth="1"
              />

              {/* Area under Earnings Curve */}
              <path
                d="M 50 145 C 100 138, 120 125, 150 125 C 180 125, 220 105, 250 100 C 280 95, 320 80, 350 78 C 380 75, 420 65, 450 62 C 480 60, 520 50, 550 48 L 550 175 L 50 175 Z"
                fill="url(#earningsGradientArea)"
              />

              {/* Area under Spending Curve */}
              <path
                d="M 50 155 C 100 150, 120 145, 150 145 C 180 145, 220 138, 250 136 C 280 134, 320 130, 350 130 C 380 130, 420 126, 450 124 C 480 122, 520 115, 550 110 L 550 175 L 50 175 Z"
                fill="url(#spendingGradientArea)"
              />

              {/* Earnings Spline Stroke */}
              <path
                d="M 50 145 C 100 138, 120 125, 150 125 C 180 125, 220 105, 250 100 C 280 95, 320 80, 350 78 C 380 75, 420 65, 450 62 C 480 60, 520 50, 550 48"
                fill="none"
                stroke="#5046E5"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Spending Spline Stroke */}
              <path
                d="M 50 155 C 100 150, 120 145, 150 145 C 180 145, 220 138, 250 136 C 280 134, 320 130, 350 130 C 380 130, 420 126, 450 124 C 480 122, 520 115, 550 110"
                fill="none"
                stroke="#FB7185"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Spending Dots (Coral/Pink) */}
              <circle cx="50" cy="155" r="4" fill="#FB7185" />
              <circle cx="150" cy="145" r="4" fill="#FB7185" />
              <circle cx="250" cy="136" r="4" fill="#FB7185" />
              <circle cx="350" cy="130" r="4" fill="#FB7185" />
              <circle cx="450" cy="124" r="4" fill="#FB7185" />
              <circle cx="550" cy="110" r="4.5" fill="#FB7185" />

              {/* Earnings Dots (Purple/Blue) - Matching exact screenshot positions */}
              <circle cx="50" cy="145" r="4.5" fill="#5046E5" />
              <circle cx="150" cy="133" r="4.5" fill="#5046E5" />
              <circle cx="250" cy="100" r="4.5" fill="#5046E5" />
              <circle cx="350" cy="85" r="4.5" fill="#5046E5" />

              {/* W5: Purple Dot with White Border Ring (matching screenshot) */}
              <circle
                cx="450"
                cy="62"
                r="6"
                fill="#5046E5"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />

              {/* W6: End Peak Dot */}
              <circle cx="550" cy="48" r="5" fill="#5046E5" />
            </svg>
          </div>

          {/* Timeline Axis (W1 to W6) with W6 Pill matching screenshot */}
          <div className="grid grid-cols-6 text-center text-xs sm:text-sm font-medium pt-3 items-center">
            {weeklyData.map((d, index) => {
              const isSelected = selectedWeek === index;
              return (
                <div key={d.label} className="flex justify-center">
                  <button
                    onClick={() => setSelectedWeek(index)}
                    className={`transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EEF2FF] text-[#5046E5] font-bold px-4 sm:px-5 py-1.5 rounded-xl shadow-xs'
                        : 'text-slate-400 hover:text-slate-600 font-medium py-1.5'
                    }`}
                  >
                    {d.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sustainability Ring Gauge (4 columns) - Exact User Screenshot Design */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center">
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight text-left">
              Sustainability
            </h2>
          </div>

          {/* Circular Badge with Mint Halo and Emerald Core matching screenshot */}
          <div className="my-auto py-6 sm:py-8 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-[#E6F9F3] flex items-center justify-center p-3.5 shadow-xs">
              {/* Outer soft mint translucent border ring */}
              <div className="absolute inset-0 rounded-full border-[9px] border-[#DCF7ED]/80 pointer-events-none" />

              {/* Inner vivid solid emerald circle */}
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#00C292] text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                  18 kg
                </span>
                <span className="text-xs sm:text-sm font-medium text-white/95 mt-1 leading-tight">
                  CO₂ avoided
                </span>
              </div>
            </div>
          </div>

          {/* Clean Subtitle matching user screenshot */}
          <p className="text-xs sm:text-sm text-slate-600 font-normal text-center max-w-xs mt-2">
            12 items reused instead of bought new. Nice work!
          </p>
        </div>
      </div>

      {/* Category Breakdown & Campus Eco-Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Category Share (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rental Activity by Category</h3>
              <p className="text-xs text-slate-400">Distribution of your resource rentals across departments.</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{cat.name}</span>
                  <span className="font-mono font-bold text-slate-900">{cat.earned} ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Trust & Badges (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#061C3D] via-[#0A224A] to-[#122A54] rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Campus Trust Rating
            </span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>

          <div className="my-auto py-2">
            <div className="text-3xl font-black text-amber-400">4.9 / 5.0</div>
            <div className="text-xs text-slate-300 font-medium mt-1">
              Top Rated Lender at {collegeName}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Based on 28 on-time returns and verified condition checks by verified peers.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <span>Verified Student ID</span>
            <span className="text-emerald-400 font-bold font-mono">100% On-Time Returns</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
