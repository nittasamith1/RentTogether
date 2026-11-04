import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CreditCard,
  Leaf,
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
  const [hoveredIndex, setHoveredIndex] = useState<number>(5);

  // Weekly data for Earnings vs Spending
  const weeklyData = [
    { label: 'W1', earnings: 220, spending: 80, date: 'Oct 01 - Oct 07' },
    { label: 'W2', earnings: 490, spending: 160, date: 'Oct 08 - Oct 14' },
    { label: 'W3', earnings: 810, spending: 290, date: 'Oct 15 - Oct 21' },
    { label: 'W4', earnings: 1180, spending: 390, date: 'Oct 22 - Oct 28' },
    { label: 'W5', earnings: 1540, spending: 510, date: 'Oct 29 - Nov 04' },
    { label: 'W6', earnings: 1840, spending: 620, date: 'Nov 05 - Nov 11' },
  ];

  const current = weeklyData[hoveredIndex] || weeklyData[weeklyData.length - 1];

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
      className="space-y-6 max-w-7xl mx-auto pb-12"
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

      {/* Main Analytics Visualizations: Earnings vs Spending + Sustainability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Earnings vs Spending Area Chart (8 columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Earnings vs Spending</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Semester trend comparing rental income generated vs borrowing costs.
              </p>
            </div>

            {/* Legend & Selected Week Detail */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span className="w-3 h-3 rounded-full bg-[#5B4DFF]" />
                <span>Earnings: ₹{current.earnings}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span className="w-3 h-3 rounded-full bg-[#FB7185]" />
                <span>Spending: ₹{current.spending}</span>
              </div>
            </div>
          </div>

          {/* Interactive Dual Spline SVG Chart */}
          <div className="relative h-60 w-full flex items-end pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="analyticsEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B4DFF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#5B4DFF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="analyticsSpendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FB7185" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Guide Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="65" x2="500" y2="65" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#E2E8F0" strokeWidth="1" />

              {/* Area Fills */}
              <path
                d="M 10 120 Q 100 100, 190 70 T 370 35 T 490 18 L 490 140 L 10 140 Z"
                fill="url(#analyticsEarningsGrad)"
              />
              <path
                d="M 10 125 Q 100 115, 190 100 T 370 85 T 490 70 L 490 140 L 10 140 Z"
                fill="url(#analyticsSpendingGrad)"
              />

              {/* Spline Lines */}
              <path
                d="M 10 120 Q 100 100, 190 70 T 370 35 T 490 18"
                fill="none"
                stroke="#5B4DFF"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 10 125 Q 100 115, 190 100 T 370 85 T 490 70"
                fill="none"
                stroke="#FB7185"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Interactive Point Markers */}
              <circle cx="10" cy="120" r="4" fill="#5B4DFF" />
              <circle cx="100" cy="100" r="4" fill="#5B4DFF" />
              <circle cx="190" cy="70" r="4" fill="#5B4DFF" />
              <circle cx="280" cy="50" r="4" fill="#5B4DFF" />
              <circle cx="370" cy="35" r="5" fill="#5B4DFF" stroke="#FFFFFF" strokeWidth="2.5" />
              <circle cx="490" cy="18" r="5" fill="#5B4DFF" stroke="#FFFFFF" strokeWidth="2.5" />

              <circle cx="10" cy="125" r="3.5" fill="#FB7185" />
              <circle cx="100" cy="115" r="3.5" fill="#FB7185" />
              <circle cx="190" cy="100" r="3.5" fill="#FB7185" />
              <circle cx="280" cy="92" r="3.5" fill="#FB7185" />
              <circle cx="370" cy="85" r="4" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="490" cy="70" r="4" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2" />
            </svg>
          </div>

          {/* Interactive X-Axis Timeline Selectors */}
          <div className="grid grid-cols-6 text-center text-xs pt-4 border-t border-slate-100 gap-1">
            {weeklyData.map((d, i) => (
              <button
                key={d.label}
                onClick={() => setHoveredIndex(i)}
                className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  hoveredIndex === i
                    ? 'font-black text-[#5B4DFF] bg-indigo-50 border border-indigo-200/60 shadow-xs'
                    : 'text-slate-400 font-semibold hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>{d.label}</div>
                <div className="text-[10px] font-normal text-slate-400 hidden sm:block">
                  ₹{d.earnings}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sustainability Ring Gauge (4 columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Sustainability</h2>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Leaf className="w-4 h-4 stroke-[2]" />
            </span>
          </div>

          {/* Circular Badge with Emerald Progress */}
          <div className="my-auto py-6 flex flex-col items-center">
            <div className="relative w-40 h-40 rounded-full bg-emerald-50 border-8 border-emerald-100/70 flex items-center justify-center p-3 shadow-inner group hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-500/25">
                <span className="text-3xl font-black tracking-tight">18 kg</span>
                <span className="text-xs font-bold text-white/95 uppercase tracking-wider mt-0.5">
                  CO₂ avoided
                </span>
              </div>
            </div>
          </div>

          {/* Impact Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-bold">
              12 items reused instead of bought new. Nice work!
            </p>
            <div className="grid grid-cols-2 gap-2 text-left pt-2">
              <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600">
                <span className="text-slate-400 block text-[10px]">Landfill Avoided</span>
                <span className="font-bold text-slate-800">4.2 kg e-waste</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600">
                <span className="text-slate-400 block text-[10px]">Campus Rank</span>
                <span className="font-bold text-emerald-600">Top 10% Eco</span>
              </div>
            </div>
          </div>
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
