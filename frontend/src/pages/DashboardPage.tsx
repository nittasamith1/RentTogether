import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  Clock,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ItemDetailModal, ModalResourceItem } from '../components/common/ItemDetailModal';
import { ListItemModal } from '../components/common/ListItemModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.first_name || user?.name?.split(' ')[0] || 'Sai';
  const collegeName = user?.college_name || 'Aditya University';

  // Modal States
  const [activeDetailItem, setActiveDetailItem] = useState<ModalResourceItem | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

            {/* Glowing orbs */}
            <circle cx="120" cy="50" r="32" fill="url(#cyanOrb)" className="opacity-95" />
            <circle cx="210" cy="140" r="64" fill="url(#orangeOrb)" className="opacity-95" />
            <circle cx="270" cy="150" r="38" fill="url(#yellowOrb)" className="opacity-95" />
            <circle cx="160" cy="160" r="50" fill="url(#glassOrb)" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-white/95 text-xs font-semibold backdrop-blur-xs">
            {collegeName} campus
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            Hello, {displayName}! Share what you have, borrow what you need.
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/listings/create')}
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

      {/* 2. Focused Operational KPI Stats (Daily Campus Relevance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Active Rentals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5B4DFF] flex items-center justify-center">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            {/* Sparkline */}
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
            <div className="text-[11px] font-semibold text-indigo-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>2 items due this week</span>
            </div>
          </div>
        </div>

        {/* Card 2: My Listings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
            {/* Sparkline */}
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
            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>5 available now</span>
            </div>
          </div>
        </div>

        {/* Card 3: Actionable Booking Requests */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/70 text-amber-800">
              Needs Review
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">Incoming Requests</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">2</div>
            <div className="text-[11px] font-medium text-amber-600 mt-1">
              Pending student handover
            </div>
          </div>
        </div>

        {/* Card 4: Financial Summary & Link to Insights */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
            <Link
              to="/analytics"
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 group"
            >
              <span>Analytics</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">Campus Savings</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">₹8,450</div>
            <Link
              to="/analytics"
              className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 block"
            >
              View full analytics & CO₂ impact →
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Operational Section: My Bookings & AI Campus Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* My Bookings (7 columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100/80">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Bookings & Action Items</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time status for items borrowed and shared.</p>
            </div>
            <Link
              to="/bookings"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View all
            </Link>
          </div>

          {/* Bookings List */}
          <div className="space-y-3 pt-3">
            {/* 1. Scientific calculator */}
            <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <CalculatorIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Scientific calculator (fx-991EX)</h4>
                  <p className="text-[11px] text-slate-400">Incoming request · 2 days · Library Desk</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('Approved calculator rental request for 2 days!')}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                >
                  Approve
                </button>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                  Pending
                </span>
              </div>
            </div>

            {/* 2. Engineering drafter */}
            <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <DrafterIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Engineering drafter</h4>
                  <p className="text-[11px] text-slate-400">Outgoing borrow · Return scheduled Friday</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/60">
                Confirmed
              </span>
            </div>

            {/* 3. Lab coat */}
            <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <LabCoatIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Lab coat & safety goggles</h4>
                  <p className="text-[11px] text-slate-400">Incoming pickup · Ready at Gate 1 Counter</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                Ready for Pickup
              </span>
            </div>
          </div>
        </div>

        {/* AI Recommendations Gradient Card (5 columns) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#4F46E5] via-[#5B4DFF] to-[#7C3AED] rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[#FACC15]">
                <Sparkles className="w-4 h-4 fill-[#FACC15]" />
              </span>
              <h2 className="text-sm font-bold text-white">AI Campus Intelligence</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Midterm Alert
            </span>
          </div>

          <div className="space-y-3.5 my-3">
            {/* Block 1: Fair price intelligence */}
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Fair Price Predictor</span>
                <span className="text-[10px] text-emerald-300 font-bold font-mono">High Demand</span>
              </div>
              <p className="text-xs text-white/90 mt-1 leading-relaxed">
                Calculators & drafters are renting 18% faster this week. List yours at ₹35–₹45/day for same-day booking.
              </p>
            </div>

            {/* Block 2: Upcoming Semester demand */}
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Exam Equipment Trend</span>
                <span className="text-[10px] text-amber-300 font-bold font-mono">CSE & ECE Labs</span>
              </div>
              <p className="text-xs text-white/90 mt-1 leading-relaxed">
                Arduino kits and lab manuals spike in demand next Monday. Pre-book your required items early.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              onClick={() => navigate('/listings/create')}
              className="text-white font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>List high-demand item</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <Link to="/analytics" className="text-white/80 hover:text-white font-medium">
              View Analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Popular Resources on Your Campus (Aditya University) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Popular on your campus ({collegeName})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified academic gear, electronics, and lab equipment available from fellow students.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            <span>Explore all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {popularCampusItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveDetailItem(item)}
              className="p-4 rounded-2xl border border-slate-100/90 bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* Illustration Preview Box */}
              <div
                className={`h-36 rounded-xl ${item.bgTint} flex items-center justify-center p-3 relative overflow-hidden transition-all group-hover:scale-[1.01]`}
              >
                {/* Visual Representations */}
                {item.id === 'scientific-calculator' && (
                  <div className="w-20 h-28 bg-[#1E1B4B] rounded-xl p-2.5 text-white flex flex-col justify-between shadow-lg shadow-indigo-950/20 border border-slate-700/60">
                    <div className="w-full h-6 rounded bg-[#94A3B8]/30 p-1 flex items-center justify-end font-mono text-[10px] text-emerald-300">
                      0.9848
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-1 text-[8px]">
                      <span className="p-1 rounded bg-slate-800 text-center text-slate-300">sin</span>
                      <span className="p-1 rounded bg-slate-800 text-center text-slate-300">cos</span>
                      <span className="p-1 rounded bg-slate-800 text-center text-slate-300">tan</span>
                      <span className="p-1 rounded bg-slate-800 text-center text-slate-300">log</span>
                      <span className="p-1 rounded bg-slate-800 text-center text-slate-300">ln</span>
                      <span className="p-1 rounded bg-amber-500 text-center text-white font-bold">AC</span>
                    </div>
                  </div>
                )}

                {item.id === 'engineering-textbook' && (
                  <div className="w-22 h-28 bg-gradient-to-tr from-emerald-700 to-teal-600 rounded-lg p-2.5 text-white shadow-lg shadow-emerald-950/20 border-l-4 border-amber-300 flex flex-col justify-between">
                    <div className="text-[9px] font-black uppercase tracking-wider text-amber-200">
                      TEXTBOOK
                    </div>
                    <div className="text-[10px] font-bold leading-tight">
                      Engineering Mechanics & Dynamics
                    </div>
                    <div className="text-[8px] text-emerald-100">J.L. Meriam</div>
                  </div>
                )}

                {item.id === 'dslr-camera' && (
                  <div className="w-28 h-22 bg-[#0F172A] rounded-2xl p-2.5 text-white shadow-lg flex items-center justify-center relative border border-slate-700">
                    <div className="w-14 h-14 rounded-full bg-slate-900 border-4 border-slate-700 flex items-center justify-center shadow-inner">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-900 to-slate-950 border-2 border-indigo-500/40" />
                    </div>
                    <div className="absolute top-2 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}

                {item.id === 'lab-coat' && (
                  <div className="w-24 h-28 bg-white rounded-xl shadow-md border border-slate-200 p-2 flex flex-col items-center justify-between">
                    <div className="w-8 h-4 border-b-2 border-slate-300 rounded-b-md" />
                    <div className="text-[9px] font-bold text-slate-700">Aditya Lab Gear</div>
                    <div className="flex gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    </div>
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="mt-3.5 space-y-1">
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#5B4DFF] transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">
                    ₹{item.pricePerDay} <span className="text-[10px] text-slate-400 font-normal">/ day</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.tagColor}`}>
                    {item.tag}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>★ {item.rating} ({item.reviewsCount})</span>
                  <span className="truncate max-w-[100px] text-[10px]">{item.pickupLocation ? item.pickupLocation.split(' ')[0] : 'Campus'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 5. Campus Verified Safe Handover Guidelines Banner */}
      <div className="rounded-2xl p-4 bg-slate-50/80 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-slate-900">Aditya University Intra-Campus Safe Meetups:</span>
            <span className="text-slate-500 ml-1">
              Recommended exchange hubs at Central Library Counter, Campus Canteen, and Gate 1.
            </span>
          </div>
        </div>
        <Link
          to="/marketplace"
          className="font-bold text-[#5B4DFF] hover:underline self-end sm:self-auto shrink-0"
        >
          Explore Campus Pool →
        </Link>
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
