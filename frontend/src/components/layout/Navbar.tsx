import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { HealthBadge } from '../common/HealthBadge';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-transparent px-8 flex items-center justify-between gap-6">
      {/* Global Campus Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search for books, calculators, laptops..."
            className="w-full pl-11 pr-4 py-2.5 bg-white/90 border border-slate-200/90 rounded-full text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-yellow-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-4">
        {/* Backend Connectivity Status */}
        <HealthBadge />

        {/* Notifications */}
        <button
          className="relative p-2.5 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-2 pr-3 py-1.5 bg-white border border-slate-200/80 rounded-full shadow-xs cursor-pointer hover:border-slate-300 transition-colors">
          <div className="w-8 h-8 rounded-full bg-brand-navy-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {user?.full_name ? user.full_name.charAt(0) : 'S'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {user?.full_name || 'Sai Reddy'}
            </div>
            <div className="text-[11px] text-slate-400 leading-tight">
              Student
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
};
