import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  Sparkles,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useMyRentals } from '../hooks/useBookings';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const collegeName = user?.college_name || 'Aditya University';

  // Real Queries
  const { data: profile } = useProfile();
  const { data: rentalsData } = useMyRentals();

  const [timeRange, setTimeRange] = useState<'WEEKLY' | 'MONTHLY' | 'SEMESTER'>('WEEKLY');

  // Calculations from real backend records
  const totalEarnings = useMemo(() => {
    return Math.round(Number(profile?.total_earnings_inr || 0));
  }, [profile]);

  const totalExpenses = useMemo(() => {
    if (!rentalsData?.results) return 0;
    return rentalsData.results
      .filter((r) => r.status === 'COMPLETED' || r.status === 'ACTIVE' || r.status === 'PAID_CONFIRMED')
      .reduce((sum, r) => sum + parseFloat(r.total_rental_fee || '0'), 0);
  }, [rentalsData]);

  const totalSavings = useMemo(() => {
    return Math.round(Number(profile?.total_savings_inr || 0));
  }, [profile]);

  const netCashflow = totalEarnings - totalExpenses;

  const itemsLentCount = profile?.total_items_lent || 0;
  const itemsBorrowedCount = profile?.total_items_borrowed || 0;
  const totalTransactions = itemsLentCount + itemsBorrowedCount;

  // Real sustainability impact calculation (approx 2.5 kg CO2 avoided per peer reused resource)
  const co2AvoidedKg = (totalTransactions * 2.5).toFixed(1);

  const hasActivity = totalTransactions > 0 || totalEarnings > 0 || totalExpenses > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto pb-16 select-none pt-2"
    >
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: '#EAE6E1' }}>
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 border"
            style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
            <span>Campus Intelligence & Personal Financials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#303653' }}>
            Analytics & Impact Overview
          </h1>
          <p className="text-xs mt-1" style={{ color: '#85899B' }}>
            Real-time financial performance, peer lending metrics, and sustainability footprint at {collegeName}.
          </p>
        </div>

        {/* Time Filter Pill */}
        <div
          className="flex items-center gap-1 p-1 rounded-2xl shadow-xs self-start sm:self-auto border"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          {(['WEEKLY', 'MONTHLY', 'SEMESTER'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

      {/* 2. Top 4 KPI Analytics Cards — Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Earnings — Fresh Mint */}
        <div
          className="rounded-3xl p-5 border shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs text-white" style={{ backgroundColor: '#42A879' }}>
              ₹
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 border"
              style={{ backgroundColor: '#B8E5CC', color: '#2D7A5B', borderColor: '#A3D9BC' }}
            >
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              {itemsLentCount} Lent
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold" style={{ color: '#2D7A5B' }}>Total Lending Earnings</span>
            <div className="text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              ₹{totalEarnings.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#2D7A5B' }}>
              Disbursed from completed loans
            </span>
          </div>
        </div>

        {/* Card 2: Total Spending — Soft Peach */}
        <div
          className="rounded-3xl p-5 border shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs text-white" style={{ backgroundColor: '#C45C20' }}>
              <CreditCard className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
              style={{ backgroundColor: '#F5CDB8', color: '#C45C20', borderColor: '#EBBA9E' }}
            >
              {itemsBorrowedCount} Borrowed
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold" style={{ color: '#C45C20' }}>Total Rental Expenses</span>
            <div className="text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              ₹{totalExpenses.toFixed(2)}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#C45C20' }}>
              Equipment rental fees paid
            </span>
          </div>
        </div>

        {/* Card 3: Total Saved vs Buying New — Soft Lavender */}
        <div
          className="rounded-3xl p-5 border shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs text-white" style={{ backgroundColor: '#7563D9' }}>
              <PiggyBank className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
              style={{ backgroundColor: '#D8D0F5', color: '#7563D9', borderColor: '#C5BBEE' }}
            >
              100% Verified
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold" style={{ color: '#7563D9' }}>Estimated Cost Savings</span>
            <div className="text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              ₹{totalSavings.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#5B48B8' }}>
              Compared to new retail purchases
            </span>
          </div>
        </div>

        {/* Card 4: Net Student Cashflow — Sky Blue */}
        <div
          className="rounded-3xl p-5 border shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs text-white" style={{ backgroundColor: '#6398D6' }}>
              <TrendingUp className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
              style={{ backgroundColor: '#C5DCFA', color: '#3A6BB5', borderColor: '#AFD0F8' }}
            >
              {netCashflow >= 0 ? 'Net Positive' : 'Active Learner'}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold" style={{ color: '#3A6BB5' }}>Net Campus Cashflow</span>
            <div className="text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              {netCashflow >= 0 ? `+₹${netCashflow.toLocaleString('en-IN')}` : `-₹${Math.abs(netCashflow).toLocaleString('en-IN')}`}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#3A6BB5' }}>
              Earnings minus rental costs
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Chart & Sustainability Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Earnings vs Spending Summary (8 columns) */}
        <div
          className="lg:col-span-8 rounded-3xl p-6 sm:p-7 border shadow-xs flex flex-col justify-between"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: '#EAE6E1' }}>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: '#303653' }}>
                Rental Financial Activity
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
                Comparison of rental income earned vs gear borrowed over time.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#42A879' }} />
                <span style={{ color: '#303653' }}>Earnings (₹{totalEarnings})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C45C20' }} />
                <span style={{ color: '#303653' }}>Spending (₹{totalExpenses.toFixed(0)})</span>
              </div>
            </div>
          </div>

          {/* Activity State */}
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            {!hasActivity ? (
              <div className="space-y-2 max-w-md">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
                >
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold" style={{ color: '#303653' }}>
                  No completed rentals recorded yet
                </h4>
                <p className="text-xs text-[#85899B] leading-relaxed">
                  Your income and expense charts will trace your transactions automatically after your first completed equipment rental or peer loan.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: '#7563D9' }}
                  >
                    Browse Items
                  </button>
                  <button
                    onClick={() => navigate('/listings/create')}
                    className="px-4 py-2 rounded-xl text-xs font-bold border"
                    style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
                  >
                    + List Equipment
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-4 rounded-2xl border" style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}>
                    <span className="text-xs font-bold text-[#2D7A5B]">Earnings Inflow</span>
                    <div className="text-xl font-black mt-1 text-[#303653]">₹{totalEarnings}</div>
                    <span className="text-[11px] text-[#2D7A5B]">From {itemsLentCount} peer loans</span>
                  </div>
                  <div className="p-4 rounded-2xl border" style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}>
                    <span className="text-xs font-bold text-[#C45C20]">Expense Outflow</span>
                    <div className="text-xl font-black mt-1 text-[#303653]">₹{totalExpenses.toFixed(0)}</div>
                    <span className="text-[11px] text-[#C45C20]">For {itemsBorrowedCount} peer borrows</span>
                  </div>
                </div>
                <p className="text-xs text-[#85899B]">
                  All transactions verified through RentTogether campus escrow and physical inspection.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sustainability Ring Gauge (4 columns) */}
        <div
          className="lg:col-span-4 rounded-3xl p-6 sm:p-7 border shadow-xs flex flex-col justify-between items-center text-center"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="w-full flex items-center justify-between pb-1">
            <h2 className="text-base font-bold tracking-tight text-left" style={{ color: '#303653' }}>
              Campus Sustainability
            </h2>
            <Leaf className="w-4 h-4 text-[#42A879]" />
          </div>

          <div className="my-auto py-6 sm:py-8 flex flex-col items-center justify-center">
            <div
              className="relative w-44 h-44 rounded-full flex items-center justify-center p-3.5 shadow-xs"
              style={{ backgroundColor: '#DDF3E7' }}
            >
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ border: '8px solid #B8E5CC' }}
              />

              <div
                className="w-32 h-32 rounded-full text-white flex flex-col items-center justify-center shadow-md"
                style={{ backgroundColor: '#42A879' }}
              >
                <span className="text-3xl font-black tracking-tight leading-none">
                  {co2AvoidedKg} kg
                </span>
                <span className="text-xs font-semibold text-white/95 mt-1 leading-tight">
                  CO₂ avoided
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs font-normal text-center max-w-xs" style={{ color: '#85899B' }}>
            {totalTransactions > 0
              ? `${totalTransactions} academic gear items reused instead of bought new. Great impact!`
              : 'Start sharing academic equipment to reduce campus e-waste and manufacturing footprints.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
