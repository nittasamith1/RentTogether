import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { HealthBadge } from '../common/HealthBadge';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-20 px-8 flex items-center justify-between gap-6 shrink-0 relative z-30">
      {/* Global Campus Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-yellow-600 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search for books, calculators, laptops..."
            className="w-full pl-11 pr-14 py-2.5 bg-white/95 border border-slate-200/80 rounded-full text-sm text-slate-800 placeholder-slate-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow focus:bg-white transition-all duration-200"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5">
        {/* Backend Connectivity Status */}
        <HealthBadge />

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200 shadow-soft hover:shadow-card active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
            </span>
          </button>

          {/* Quick Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-card border border-slate-100 p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900">Campus Alerts</span>
                <span className="text-[11px] font-semibold text-brand-yellow-600">2 New</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-slate-700">
                  <div className="font-semibold text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Booking Request Approved!</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Your request for Casio fx-991EX was accepted by Rahul.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                  <div className="font-semibold text-slate-900 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>Campus Verification Verified</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Your student ID for VNRVJIET is 100% active.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-2 pr-3.5 py-1.5 bg-white border border-slate-200/80 rounded-full shadow-soft hover:shadow-card hover:border-slate-300 transition-all duration-200 cursor-pointer active:scale-98"
          >
            <div className="w-8 h-8 rounded-full bg-brand-navy-900 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-brand-yellow/30">
              {user?.full_name ? user.full_name.charAt(0) : 'S'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user?.full_name || 'Sai Reddy'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium leading-tight">
                Student · VNRVJIET
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                showProfileMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-card border border-slate-100 p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{user?.full_name || 'Sai Reddy'}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email || 'sai.reddy@vnrvjiet.in'}</div>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Student
                </div>
              </div>
              <div className="pt-1 text-xs font-medium text-slate-600">
                <div className="px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                  Student Reputation: <span className="font-bold text-slate-900">★ 4.9</span>
                </div>
                <div className="px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                  Total Saved: <span className="font-bold text-emerald-600">₹2,450</span>
                </div>
                <div className="px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                  Total Earned: <span className="font-bold text-brand-yellow-600">₹1,800</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
