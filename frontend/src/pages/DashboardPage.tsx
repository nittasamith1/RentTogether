import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ItemDetailModal, ModalResourceItem } from '../components/common/ItemDetailModal';
import { ListItemModal } from '../components/common/ListItemModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.first_name || user?.name?.split(' ')[0] || 'Sai';
  const collegeName = user?.college_code || 'VNRVJIET';

  // Modal States
  const [activeDetailItem, setActiveDetailItem] = useState<ModalResourceItem | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active chart hover index for W1 to W6
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(5);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Weekly data for Earnings vs Spending
  const chartData = [
    { week: 'W1', earnings: 220, spending: 80 },
    { week: 'W2', earnings: 490, spending: 160 },
    { week: 'W3', earnings: 810, spending: 290 },
    { week: 'W4', earnings: 1180, spending: 390 },
    { week: 'W5', earnings: 1540, spending: 510 },
    { week: 'W6', earnings: 1840, spending: 620 },
  ];

  // 4 Popular Campus Items matching user's screenshot
  const popularCampusItems: (ModalResourceItem & { tag: string; tagColor: string; bgTint: string })[] = [
    {
      id: 'scientific-calculator',
      title: 'Scientific calculator',
      category: 'Electronics',
      tag: 'Electronics',
      tagColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      bgTint: 'bg-indigo-50/70 border-indigo-100/80',
      pricePerDay: 40,
      rating: 4.9,
      reviewsCount: 32,
      ownerName: 'Sai R.',
      deposit: 200,
      pickupLocation: 'Library Ground Floor Counter',
      image: '',
    },
    {
      id: 'engineering-textbook',
      title: 'Engineering textbook',
      category: 'Books',
      tag: 'Books',
      tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      bgTint: 'bg-emerald-50/70 border-emerald-100/80',
      pricePerDay: 25,
      rating: 4.8,
      reviewsCount: 19,
      ownerName: 'Priya K.',
      deposit: 150,
      pickupLocation: 'Main Canteen Reception',
      image: '',
    },
    {
      id: 'dslr-camera',
      title: 'DSLR camera',
      category: 'Media',
      tag: 'Media',
      tagColor: 'text-amber-700 bg-amber-50 border-amber-100',
      bgTint: 'bg-amber-50/70 border-amber-100/80',
      pricePerDay: 150,
      rating: 4.9,
      reviewsCount: 41,
      ownerName: 'Varun T.',
      deposit: 1200,
      pickupLocation: 'Campus Gate 1 Security Desk',
      image: '',
    },
    {
      id: 'lab-coat',
      title: 'Lab coat',
      category: 'Lab gear',
      tag: 'Lab gear',
      tagColor: 'text-rose-700 bg-rose-50 border-rose-100',
      bgTint: 'bg-rose-50/70 border-rose-100/80',
      pricePerDay: 20,
      rating: 4.7,
      reviewsCount: 15,
      ownerName: 'Neha M.',
      deposit: 100,
      pickupLocation: 'Chemistry Lab B-Block 102',
      image: '',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1E1B4B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-400/30"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Hero Welcome Banner matching screenshot */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#5046E5] via-[#5B4DFF] to-[#7234E8] text-white p-7 sm:p-9 shadow-sm">
        {/* Abstract 3D Glowing Overlapping Spheres on the Right */}
        <div className="absolute -right-10 -top-12 w-80 h-80 pointer-events-none select-none hidden md:block">
          <svg viewBox="0 0 300 300" className="w-full h-full">
            <defs>
              <radialGradient id="cyanOrb" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="60%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0891B2" />
              </radialGradient>
              <radialGradient id="orangeOrb" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FDBA74" />
                <stop offset="55%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </radialGradient>
              <radialGradient id="yellowOrb" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="60%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#EAB308" />
              </radialGradient>
              <radialGradient id="glassOrb" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
                <stop offset="70%" stopColor="rgba(255, 255, 255, 0.1)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
              </radialGradient>
            </defs>

            {/* Glowing orbs positioned like the reference */}
            <circle cx="120" cy="50" r="32" fill="url(#cyanOrb)" className="opacity-95" />
            <circle cx="210" cy="140" r="64" fill="url(#orangeOrb)" className="opacity-95" />
            <circle cx="270" cy="150" r="38" fill="url(#yellowOrb)" className="opacity-95" />
            <circle cx="160" cy="160" r="50" fill="url(#glassOrb)" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-white/95 text-xs font-semibold backdrop-blur-xs">
            {collegeName} campus
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            Hello, {displayName}! Share what you have, borrow what you need.
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsListModalOpen(true)}
              className="bg-white text-[#1E1B4B] px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              + List an item
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all backdrop-blur-xs active:scale-95 cursor-pointer"
            >
              Browse campus
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 KPI Quick Stats Cards in 1 Row matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Rentals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5B4DFF] flex items-center justify-center">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            {/* Purple Mini Sparkline */}
            <svg className="w-16 h-8 text-[#5B4DFF]" viewBox="0 0 64 24" fill="none">
              <path
                d="M 2 16 Q 16 6, 28 14 T 48 8 T 62 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">My Rentals</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">3</div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">2 due this week</div>
          </div>
        </div>

        {/* Card 2: My Listings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
            {/* Green Mini Sparkline */}
            <svg className="w-16 h-8 text-emerald-500" viewBox="0 0 64 24" fill="none">
              <path
                d="M 2 18 Q 18 8, 32 14 T 50 10 T 62 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">My Listings</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">7</div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">5 available now</div>
          </div>
        </div>

        {/* Card 3: My Earnings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
            {/* Orange Mini Sparkline */}
            <svg className="w-16 h-8 text-amber-500" viewBox="0 0 64 24" fill="none">
              <path
                d="M 2 18 Q 16 16, 30 8 T 48 12 T 62 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">My Earnings</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">₹1,840</div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">up this semester</div>
          </div>
        </div>

        {/* Card 4: My Spending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <CreditCardIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            {/* Pink Mini Sparkline */}
            <svg className="w-16 h-8 text-rose-500" viewBox="0 0 64 24" fill="none">
              <path
                d="M 2 14 Q 14 6, 30 16 T 48 10 T 62 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">My Spending</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">₹620</div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">3 rentals</div>
          </div>
        </div>
      </div>

      {/* 3. Middle Row 1: Earnings vs Spending & Sustainability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Earnings vs Spending Area Chart (8 columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-sm font-bold text-slate-900">Earnings vs Spending</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B4DFF]" />
                <span>Earnings</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
                <span>Spending</span>
              </div>
            </div>
          </div>

          {/* Dual Spline SVG Chart */}
          <div className="relative h-44 w-full flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 130" preserveAspectRatio="none">
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B4DFF" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#5B4DFF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#FB7185" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid guide lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="65" x2="500" y2="65" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#F1F5F9" strokeWidth="1" />

              {/* Area fills */}
              <path
                d="M 10 100 Q 100 85, 190 60 T 370 28 T 490 15 L 490 110 L 10 110 Z"
                fill="url(#earningsGrad)"
              />
              <path
                d="M 10 105 Q 100 95, 190 85 T 370 75 T 490 62 L 490 110 L 10 110 Z"
                fill="url(#spendingGrad)"
              />

              {/* Spline Lines */}
              <path
                d="M 10 100 Q 100 85, 190 60 T 370 28 T 490 15"
                fill="none"
                stroke="#5B4DFF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 10 105 Q 100 95, 190 85 T 370 75 T 490 62"
                fill="none"
                stroke="#FB7185"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Point Markers */}
              <circle cx="10" cy="100" r="3.5" fill="#5B4DFF" />
              <circle cx="100" cy="85" r="3.5" fill="#5B4DFF" />
              <circle cx="190" cy="60" r="3.5" fill="#5B4DFF" />
              <circle cx="280" cy="45" r="3.5" fill="#5B4DFF" />
              <circle cx="370" cy="28" r="4.5" fill="#5B4DFF" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="490" cy="15" r="4.5" fill="#5B4DFF" stroke="#FFFFFF" strokeWidth="2" />

              <circle cx="10" cy="105" r="3" fill="#FB7185" />
              <circle cx="100" cy="95" r="3" fill="#FB7185" />
              <circle cx="190" cy="85" r="3" fill="#FB7185" />
              <circle cx="280" cy="80" r="3" fill="#FB7185" />
              <circle cx="370" cy="75" r="3.5" fill="#FB7185" />
              <circle cx="490" cy="62" r="3.5" fill="#FB7185" />
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="grid grid-cols-6 text-center text-xs text-slate-400 font-medium pt-3 border-t border-slate-50">
            {chartData.map((d, i) => (
              <button
                key={d.week}
                onClick={() => setHoveredWeek(i)}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  hoveredWeek === i ? 'font-bold text-[#5B4DFF] bg-indigo-50/50' : 'hover:text-slate-700'
                }`}
              >
                {d.week}
              </button>
            ))}
          </div>
        </div>

        {/* Sustainability Ring Gauge (4 columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900">Sustainability</h2>

          {/* Circular Badge with Emerald Progress */}
          <div className="my-auto py-2 flex flex-col items-center">
            <div className="relative w-36 h-36 rounded-full bg-emerald-50 border-4 border-emerald-100/60 flex items-center justify-center p-3 shadow-inner">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-500/25">
                <span className="text-2xl font-black tracking-tight">18 kg</span>
                <span className="text-[11px] font-semibold text-white/90">CO₂ avoided</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium text-center">
            12 items reused instead of bought new. Nice work!
          </p>
        </div>
      </div>

      {/* 4. Middle Row 2: My Bookings & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* My Bookings (7 columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-sm font-bold text-slate-900">My Bookings</h2>
            <Link
              to="/bookings"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View all
            </Link>
          </div>

          {/* Bookings List matching screenshot */}
          <div className="space-y-3 pt-1">
            {/* 1. Scientific calculator */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <CalculatorIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Scientific calculator</h4>
                  <p className="text-[11px] text-slate-400">Incoming request · 2 days</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                Pending
              </span>
            </div>

            {/* 2. Engineering drafter */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <DrafterIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Engineering drafter</h4>
                  <p className="text-[11px] text-slate-400">Outgoing · return Friday</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/60">
                Confirmed
              </span>
            </div>

            {/* 3. Lab coat */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <LabCoatIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Lab coat</h4>
                  <p className="text-[11px] text-slate-400">Incoming · pickup today</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* AI Recommendations Gradient Card (5 columns) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#4F46E5] via-[#5B4DFF] to-[#7C3AED] rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-2">
            <span className="text-[#FACC15]">
              <Sparkles className="w-4 h-4 fill-[#FACC15]" />
            </span>
            <h2 className="text-sm font-bold text-white">AI Recommendations</h2>
          </div>

          <div className="space-y-3.5 my-2">
            {/* Block 1: Fair price */}
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="text-[11px] font-bold text-[#FACC15] tracking-wide">
                Fair price
              </div>
              <p className="text-xs text-white/95 mt-1 leading-relaxed">
                Scientific calculator: try <span className="font-bold underline decoration-amber-300">₹35–45 / day</span> to rent faster.
              </p>
            </div>

            {/* Block 2: Demand forecast */}
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="text-[11px] font-bold text-teal-200 tracking-wide">
                Demand forecast
              </div>
              <p className="text-xs text-white/95 mt-1 leading-relaxed">
                Lab coats and drafters will be in high demand next week for mid-terms.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-white/70 flex items-center gap-1.5 pt-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-300" />
            <span>Updated 2 hours ago from campus rental trends</span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Popular on your campus matching screenshot */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Popular on your campus</h2>
          <Link
            to="/marketplace"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            See marketplace
          </Link>
        </div>

        {/* 4 Items Grid matching screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularCampusItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              onClick={() => setActiveDetailItem(item)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* Product Illustration Box */}
              <div
                className={`w-full h-36 rounded-xl flex items-center justify-center transition-all ${item.bgTint} group-hover:scale-[1.02]`}
              >
                {item.id === 'scientific-calculator' && (
                  <svg viewBox="0 0 64 64" className="w-16 h-16 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="16" y="8" width="32" height="48" rx="6" className="fill-indigo-100/60 stroke-indigo-500" />
                    <rect x="20" y="14" width="24" height="10" rx="2" className="fill-indigo-200/80 stroke-indigo-500" />
                    <line x1="24" y1="28" x2="28" y2="28" strokeLinecap="round" strokeWidth="2" />
                    <line x1="32" y1="28" x2="36" y2="28" strokeLinecap="round" strokeWidth="2" />
                    <line x1="40" y1="28" x2="44" y2="28" strokeLinecap="round" strokeWidth="2" />
                    <line x1="24" y1="34" x2="28" y2="34" strokeLinecap="round" strokeWidth="2" />
                    <line x1="32" y1="34" x2="36" y2="34" strokeLinecap="round" strokeWidth="2" />
                    <line x1="40" y1="34" x2="44" y2="34" strokeLinecap="round" strokeWidth="2" />
                    <line x1="24" y1="40" x2="28" y2="40" strokeLinecap="round" strokeWidth="2" />
                    <line x1="32" y1="40" x2="36" y2="40" strokeLinecap="round" strokeWidth="2" />
                    <line x1="40" y1="40" x2="44" y2="40" strokeLinecap="round" strokeWidth="2" />
                    <line x1="24" y1="46" x2="40" y2="46" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                )}

                {item.id === 'engineering-textbook' && (
                  <svg viewBox="0 0 64 64" className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="16" y="10" width="32" height="44" rx="4" className="fill-emerald-100/60 stroke-emerald-500" />
                    <line x1="24" y1="10" x2="24" y2="54" className="stroke-emerald-400" strokeWidth="1.5" />
                    <line x1="30" y1="20" x2="42" y2="20" strokeLinecap="round" strokeWidth="2" />
                    <line x1="30" y1="26" x2="40" y2="26" strokeLinecap="round" strokeWidth="2" />
                    <line x1="30" y1="32" x2="38" y2="32" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                )}

                {item.id === 'dslr-camera' && (
                  <svg viewBox="0 0 64 64" className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="10" y="20" width="44" height="32" rx="6" className="fill-amber-100/60 stroke-amber-500" />
                    <path d="M22 20 L26 14 L38 14 L42 20 Z" className="fill-amber-200/60 stroke-amber-500" />
                    <circle cx="32" cy="36" r="10" className="fill-amber-200/80 stroke-amber-500" />
                    <circle cx="32" cy="36" r="5" className="fill-amber-400 stroke-amber-600" />
                  </svg>
                )}

                {item.id === 'lab-coat' && (
                  <svg viewBox="0 0 64 64" className="w-16 h-16 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 14 L26 10 L38 10 L44 14 L50 24 L42 28 L40 54 L24 54 L22 28 L14 24 Z" className="fill-rose-100/60 stroke-rose-500" />
                    <line x1="32" y1="22" x2="32" y2="54" strokeWidth="1.5" className="stroke-rose-400" />
                    <circle cx="32" cy="28" r="1.5" className="fill-rose-500" stroke="none" />
                    <circle cx="32" cy="36" r="1.5" className="fill-rose-500" stroke="none" />
                    <circle cx="32" cy="44" r="1.5" className="fill-rose-500" stroke="none" />
                  </svg>
                )}
              </div>

              {/* Title, Price and Category */}
              <div className="mt-3">
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#5B4DFF] transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-extrabold text-slate-900">
                    ₹{item.pricePerDay} <span className="text-[10px] text-slate-400 font-normal">/ day</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.tagColor}`}>
                    {item.tag}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={activeDetailItem}
        onClose={() => setActiveDetailItem(null)}
        onRequestBooking={(item) => {
          setActiveDetailItem(null);
          showToast(`Rental request submitted for ${item.title}!`);
        }}
      />

      {/* List Item Modal */}
      <ListItemModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onItemCreated={(title) => {
          showToast(`"${title}" listed successfully!`);
        }}
      />
    </div>
  );
};

// Reusable SVG Micro-Icons for the Booking section
function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="2" y="5" width="20" height="14" rx="3" strokeWidth="2" />
      <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="4" y="2" width="16" height="20" rx="3" strokeWidth="2" />
      <line x1="8" y1="6" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="11" x2="10" y2="11" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="11" x2="16" y2="11" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="16" x2="10" y2="16" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="16" x2="16" y2="16" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DrafterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 2 L3 21 L8 21 L12 11 L16 21 L21 21 Z" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LabCoatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M6 4 L10 2 L14 2 L18 4 L20 9 L17 11 L16 22 L8 22 L7 11 L4 9 Z" strokeWidth="2" strokeLinejoin="round" />
      <line x1="12" y1="7" x2="12" y2="22" strokeWidth="1.5" />
    </svg>
  );
}
