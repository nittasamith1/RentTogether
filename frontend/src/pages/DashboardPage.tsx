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
  const displayName = user?.first_name || user?.name?.split(' ')[0] || 'Student';
  const collegeName = user?.college_name || 'Aditya University';

  const [activeDetailItem, setActiveDetailItem] = useState<ModalResourceItem | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const popularCampusItems: (ModalResourceItem & { tag: string; tagBg: string; tagText: string; cardBg: string })[] = [
    {
      id: 'scientific-calculator',
      title: 'Scientific calculator',
      category: 'Electronics',
      tag: 'Electronics',
      tagBg: '#E9E3FF',
      tagText: '#7563D9',
      cardBg: '#F5F2FF',
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
      tag: 'Academic',
      tagBg: '#DDF3E7',
      tagText: '#42A879',
      cardBg: '#F0FAF4',
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
      tag: 'Creative',
      tagBg: '#FFE5D6',
      tagText: '#C45C20',
      cardBg: '#FFF3EC',
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
      tag: 'Laboratory',
      tagBg: '#DFEDFF',
      tagText: '#3A6BB5',
      cardBg: '#EFF6FF',
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
    <div className="space-y-5 max-w-7xl mx-auto pb-8 select-none pt-4">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border"
            style={{ backgroundColor: '#303653', borderColor: '#7563D9', color: '#fff' }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#42A879' }} />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Hero Welcome Banner — Soft Lavender */}
      <div
        className="relative rounded-3xl overflow-hidden text-white p-7 sm:p-9 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #7563D9 0%, #6552C5 50%, #5A42B8 100%)' }}
      >
        {/* Decorative soft orbs */}
        <div className="absolute -right-10 -top-10 w-72 h-72 pointer-events-none select-none hidden md:block">
          <svg viewBox="0 0 300 300" className="w-full h-full opacity-25">
            <circle cx="120" cy="80" r="80" fill="white" />
            <circle cx="220" cy="160" r="60" fill="white" />
            <circle cx="260" cy="80" r="40" fill="white" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-xl space-y-4">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'rgba(255,255,255,0.20)', color: 'rgba(255,255,255,0.95)' }}
          >
            {collegeName} campus
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            Hello, {displayName}! Share what you have, borrow what you need.
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/listings/create')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
              style={{ backgroundColor: '#fff', color: '#7563D9' }}
            >
              + List an item
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(4px)' }}
            >
              Browse campus
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Rentals — Soft Lavender */}
        <div
          className="rounded-2xl p-5 border shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#7563D9' }}>
              <ArrowRight className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            <svg className="w-16 h-8" viewBox="0 0 64 24" fill="none" style={{ color: '#7563D9' }}>
              <path d="M 2 16 Q 16 6, 28 14 T 48 8 T 62 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium" style={{ color: '#85899B' }}>My Rentals</div>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#303653' }}>3</div>
            <div className="text-[11px] font-semibold mt-1 flex items-center gap-1" style={{ color: '#7563D9' }}>
              <Clock className="w-3 h-3" />
              <span>2 items due this week</span>
            </div>
          </div>
        </div>

        {/* Card 2: My Listings — Sky Blue */}
        <div
          className="rounded-2xl p-5 border shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between"
          style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6398D6' }}>
              <Layers className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            <svg className="w-16 h-8" viewBox="0 0 64 24" fill="none" style={{ color: '#6398D6' }}>
              <path d="M 2 18 Q 18 8, 32 14 T 50 10 T 62 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium" style={{ color: '#85899B' }}>My Listings</div>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#303653' }}>7</div>
            <div className="text-[11px] font-semibold mt-1 flex items-center gap-1" style={{ color: '#6398D6' }}>
              <CheckCircle2 className="w-3 h-3" />
              <span>5 available now</span>
            </div>
          </div>
        </div>

        {/* Card 3: Incoming Requests — Fresh Mint */}
        <div
          className="rounded-2xl p-5 border shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#42A879' }}>
              <Calendar className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: '#E8A447', color: '#fff' }}
            >
              Needs Review
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium" style={{ color: '#85899B' }}>Incoming Requests</div>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#303653' }}>2</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: '#42A879' }}>
              Pending student handover
            </div>
          </div>
        </div>

        {/* Card 4: Campus Savings — Soft Peach */}
        <div
          className="rounded-2xl p-5 border shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#C45C20', color: '#fff' }}>
              ₹
            </div>
            <Link
              to="/analytics"
              className="text-[11px] font-bold flex items-center gap-0.5 group"
              style={{ color: '#C45C20' }}
            >
              <span>Analytics</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium" style={{ color: '#85899B' }}>Campus Savings</div>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#303653' }}>₹8,450</div>
            <Link
              to="/analytics"
              className="text-[11px] font-bold hover:underline mt-1 block"
              style={{ color: '#C45C20' }}
            >
              View full analytics & CO₂ impact →
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Bookings + AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Active Bookings (7 col) */}
        <div
          className="lg:col-span-7 rounded-2xl p-6 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #EAE6E1' }}>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#303653' }}>Active Bookings & Action Items</h2>
              <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>Real-time status for items borrowed and shared.</p>
            </div>
            <Link to="/bookings" className="text-xs font-semibold transition-colors" style={{ color: '#7563D9' }}>
              View all
            </Link>
          </div>

          <div className="space-y-3 pt-3">
            {/* Item 1 */}
            <div
              className="flex items-center justify-between p-3.5 rounded-xl transition-colors border"
              style={{ borderColor: '#EAE6E1' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F2FF')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}>
                  <CalculatorIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: '#303653' }}>Scientific calculator (fx-991EX)</h4>
                  <p className="text-[11px]" style={{ color: '#85899B' }}>Incoming request · 2 days · Library Desk</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('Approved calculator rental request for 2 days!')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  style={{ color: '#7563D9' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E9E3FF')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Approve
                </button>
                <span
                  className="px-3 py-1 rounded-full text-[11px] font-bold border"
                  style={{ backgroundColor: '#FFF3DC', color: '#B07000', borderColor: '#F5D68A' }}
                >
                  Pending
                </span>
              </div>
            </div>

            {/* Item 2 */}
            <div
              className="flex items-center justify-between p-3.5 rounded-xl transition-colors border"
              style={{ borderColor: '#EAE6E1' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0FAF4')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#DDF3E7', color: '#42A879' }}>
                  <DrafterIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: '#303653' }}>Engineering drafter</h4>
                  <p className="text-[11px]" style={{ color: '#85899B' }}>Outgoing borrow · Return scheduled Friday</p>
                </div>
              </div>
              <span
                className="px-3 py-1 rounded-full text-[11px] font-bold border"
                style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
              >
                Confirmed
              </span>
            </div>

            {/* Item 3 */}
            <div
              className="flex items-center justify-between p-3.5 rounded-xl transition-colors border"
              style={{ borderColor: '#EAE6E1' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#DFEDFF', color: '#6398D6' }}>
                  <LabCoatIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: '#303653' }}>Lab coat & safety goggles</h4>
                  <p className="text-[11px]" style={{ color: '#85899B' }}>Incoming pickup · Ready at Gate 1 Counter</p>
                </div>
              </div>
              <span
                className="px-3 py-1 rounded-full text-[11px] font-bold border"
                style={{ backgroundColor: '#E9E3FF', color: '#7563D9', borderColor: '#D8D0F5' }}
              >
                Ready for Pickup
              </span>
            </div>
          </div>
        </div>

        {/* AI Campus Intelligence (5 col) — Lavender */}
        <div
          className="lg:col-span-5 rounded-2xl p-6 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid #D0C8F0' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: '#7563D9' }} />
              <h2 className="text-sm font-bold" style={{ color: '#303653' }}>AI Campus Intelligence</h2>
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#7563D9', color: '#fff' }}
            >
              Midterm Alert
            </span>
          </div>

          <div className="space-y-3 my-3">
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: '#303653' }}>Fair Price Predictor</span>
                <span className="text-[10px] font-bold font-mono" style={{ color: '#42A879' }}>High Demand</span>
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#85899B' }}>
                Calculators & drafters are renting 18% faster this week. List yours at ₹35–₹45/day for same-day booking.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: '#303653' }}>Exam Equipment Trend</span>
                <span className="text-[10px] font-bold font-mono" style={{ color: '#E8A447' }}>CSE & ECE Labs</span>
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#85899B' }}>
                Arduino kits and lab manuals spike in demand next Monday. Pre-book your required items early.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid #D0C8F0' }}>
            <button
              onClick={() => navigate('/listings/create')}
              className="font-bold flex items-center gap-1 cursor-pointer hover:underline"
              style={{ color: '#7563D9' }}
            >
              <span>List high-demand item</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <Link to="/analytics" className="font-medium hover:underline" style={{ color: '#6552C5' }}>
              View Analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Popular Resources */}
      <div
        className="rounded-2xl p-6 border shadow-sm space-y-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-bold" style={{ color: '#303653' }}>
              Popular on your campus ({collegeName})
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
              Verified academic gear, electronics, and lab equipment from fellow students.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="text-xs font-bold transition-colors flex items-center gap-1"
            style={{ color: '#7563D9' }}
          >
            <span>Explore all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {popularCampusItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveDetailItem(item)}
              className="p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#D8D0F5';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(117,99,217,0.10)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#EAE6E1';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Illustration */}
              <div
                className="h-36 rounded-xl flex items-center justify-center p-3 relative overflow-hidden transition-all"
                style={{ backgroundColor: item.cardBg }}
              >
                {item.id === 'scientific-calculator' && (
                  <div className="w-20 h-28 bg-[#303653] rounded-xl p-2.5 text-white flex flex-col justify-between shadow-lg border border-slate-700/40">
                    <div className="w-full h-6 rounded bg-slate-700/50 p-1 flex items-center justify-end font-mono text-[10px] text-emerald-300">
                      0.9848
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-1 text-[8px]">
                      <span className="p-1 rounded bg-slate-700 text-center text-slate-300">sin</span>
                      <span className="p-1 rounded bg-slate-700 text-center text-slate-300">cos</span>
                      <span className="p-1 rounded bg-slate-700 text-center text-slate-300">tan</span>
                      <span className="p-1 rounded bg-slate-700 text-center text-slate-300">log</span>
                      <span className="p-1 rounded bg-slate-700 text-center text-slate-300">ln</span>
                      <span className="p-1 rounded text-center text-white font-bold" style={{ backgroundColor: '#7563D9' }}>AC</span>
                    </div>
                  </div>
                )}
                {item.id === 'engineering-textbook' && (
                  <div className="w-22 h-28 rounded-lg p-2.5 text-white shadow-lg border-l-4 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #42A879, #2D7A5B)', borderLeftColor: '#E8A447' }}>
                    <div className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#FDE68A' }}>TEXTBOOK</div>
                    <div className="text-[10px] font-bold leading-tight">Engineering Mechanics & Dynamics</div>
                    <div className="text-[8px] text-green-100">J.L. Meriam</div>
                  </div>
                )}
                {item.id === 'dslr-camera' && (
                  <div className="w-28 h-22 rounded-2xl p-2.5 text-white shadow-lg flex items-center justify-center relative border border-slate-700" style={{ backgroundColor: '#303653' }}>
                    <div className="w-14 h-14 rounded-full bg-slate-900 border-4 border-slate-700 flex items-center justify-center shadow-inner">
                      <div className="w-8 h-8 rounded-full border-2" style={{ background: 'linear-gradient(135deg, #7563D9, #303653)', borderColor: 'rgba(117,99,217,0.4)' }} />
                    </div>
                    <div className="absolute top-2 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}
                {item.id === 'lab-coat' && (
                  <div className="w-24 h-28 bg-white rounded-xl shadow-md border border-slate-200 p-2 flex flex-col items-center justify-between">
                    <div className="w-8 h-4 border-b-2 border-slate-300 rounded-b-md" />
                    <div className="text-[9px] font-bold" style={{ color: '#303653' }}>Aditya Lab Gear</div>
                    <div className="flex gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-3.5 space-y-1">
                <h3 className="text-xs font-bold line-clamp-1 transition-colors group-hover:text-[#7563D9]" style={{ color: '#303653' }}>
                  {item.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold" style={{ color: '#303653' }}>
                    ₹{item.pricePerDay} <span className="text-[10px] font-normal" style={{ color: '#85899B' }}>/ day</span>
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: item.tagBg, color: item.tagText }}
                  >
                    {item.tag}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]" style={{ color: '#85899B' }}>
                  <span>★ {item.rating} ({item.reviewsCount})</span>
                  <span className="truncate max-w-[100px] text-[10px]">{item.pickupLocation ? item.pickupLocation.split(' ')[0] : 'Campus'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 5. Safe Handover Banner */}
      <div
        className="rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#42A879' }}>
            <ShieldCheck className="w-4 h-4 stroke-[2.5] text-white" />
          </div>
          <div>
            <span className="font-bold" style={{ color: '#303653' }}>Aditya University Intra-Campus Safe Meetups:</span>
            <span className="ml-1" style={{ color: '#85899B' }}>
              Recommended exchange hubs at Central Library Counter, Campus Canteen, and Gate 1.
            </span>
          </div>
        </div>
        <Link to="/marketplace" className="font-bold hover:underline self-end sm:self-auto shrink-0" style={{ color: '#42A879' }}>
          Explore Campus Pool →
        </Link>
      </div>

      {/* Modals */}
      <ItemDetailModal
        item={activeDetailItem}
        onClose={() => setActiveDetailItem(null)}
        onRequestBooking={(item) => {
          setActiveDetailItem(null);
          showToast(`Rental request submitted for ${item.title}!`);
        }}
      />
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
