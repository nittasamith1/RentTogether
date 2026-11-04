import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  CalendarCheck,
  IndianRupee,
  Leaf,
  Plus,
  ArrowRight,
  Heart,
  Star,
  Coins,
  Recycle,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock initial items matching the reference dashboard mockup
  const popularResources = [
    {
      id: 'item-1',
      title: 'Casio fx-991EX',
      category: 'Calculator',
      pricePerDay: 30,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'item-2',
      title: 'DSA Book Set',
      category: 'Books',
      pricePerDay: 20,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'item-3',
      title: 'Arduino Uno Kit',
      category: 'Project',
      pricePerDay: 80,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1608564697071-ddf911d81370?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'item-4',
      title: 'Canon DSLR',
      category: 'Electronics',
      pricePerDay: 250,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80',
    },
  ];

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* 1. Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-50/80 via-white to-amber-100/40 p-8 sm:p-10 border border-amber-100/60 shadow-soft">
        <div className="max-w-xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/20 text-brand-navy-950 text-xs font-extrabold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-brand-yellow-600" />
            Campus Resource Sharing
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, Sai!
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Rent, lend and share resources within your verified campus community.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/explore')}
              className="gap-2 shadow-md shadow-brand-yellow/20"
            >
              <span>Explore Resources</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/listings')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>List an Item</span>
            </Button>
          </div>
        </div>

        {/* Decorative Graphic Element */}
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none select-none">
          <div className="w-80 h-44 rounded-2xl bg-gradient-to-br from-brand-yellow/20 to-brand-navy-900/10 backdrop-blur-sm border border-white/60 p-4 shadow-xl flex items-center justify-center text-center">
            <div className="space-y-1">
              <div className="text-2xl font-black text-brand-navy-950">VNRVJIET Hub</div>
              <div className="text-xs text-slate-600">Active Campus Ecosystem · Single-College Mode</div>
              <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                ● High Trust Peer Network
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row (4 KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {/* Active Rentals */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">3</div>
            <div className="text-xs font-medium text-slate-500">Active Rentals</div>
          </div>
        </Card>

        {/* Completed Rentals */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">8</div>
            <div className="text-xs font-medium text-slate-500">Completed Rentals</div>
          </div>
        </Card>

        {/* Money Saved */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100/70 text-rose-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">₹2,450</div>
            <div className="text-xs font-medium text-slate-500">Money Saved</div>
          </div>
        </Card>

        {/* Waste Avoided */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">12.4 kg</div>
            <div className="text-xs font-medium text-slate-500">Waste Avoided</div>
          </div>
        </Card>
      </div>

      {/* 3. Main Bottom Section: Popular Resources + Sustainability Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Popular Resources Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Popular Resources
            </h2>
            <button
              onClick={() => navigate('/explore')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {popularResources.map((item) => (
              <Card
                key={item.id}
                className="p-3.5 flex flex-col justify-between group hover:border-brand-yellow-400 transition-all cursor-pointer"
                onClick={() => navigate(`/explore`)}
              >
                <div>
                  {/* Item Image with Wishlist Button */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-white shadow-xs transition-colors"
                      aria-label="Wishlist"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {item.title}
                  </h3>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[10px]">
                    {item.category}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <div className="font-extrabold text-sm text-slate-900">
                    ₹{item.pricePerDay} <span className="text-[11px] font-normal text-slate-500">/ day</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{item.rating}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sustainability Impact Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Leaf className="w-5 h-5 text-amber-500" />
              <span>Sustainability Impact</span>
            </h2>
          </div>

          <Card className="p-6 space-y-6">
            {/* Donut Chart Simulation matching UI Mockup */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#F3F4F6"
                    strokeWidth="11"
                  />
                  {/* Contribution Arc (78%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#FBBF24"
                    strokeWidth="11"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - 0.78)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900">78%</span>
                  <span className="text-[11px] font-medium text-slate-500">Your Contribution</span>
                </div>
              </div>
            </div>

            {/* Impact Metric Breakdown List */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-600 text-xs">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Total Money Saved</span>
                </div>
                <span className="font-extrabold text-slate-900 text-sm">₹2,450</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-600 text-xs">
                  <Recycle className="w-4 h-4 text-emerald-500" />
                  <span>Resources Reused</span>
                </div>
                <span className="font-extrabold text-slate-900 text-sm">12</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-600 text-xs">
                  <Leaf className="w-4 h-4 text-cyan-500" />
                  <span>Estimated Waste Reduced</span>
                </div>
                <span className="font-extrabold text-slate-900 text-sm">12.4 kg</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
