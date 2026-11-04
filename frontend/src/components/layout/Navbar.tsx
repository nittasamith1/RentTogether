import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, ChevronDown, ShieldCheck, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.name || user?.first_name || 'Sai Reddy';
  const roleLabel = user?.is_staff ? 'Campus Admin' : 'Verified Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-20 px-8 flex items-center justify-between gap-6 shrink-0 relative z-30 bg-transparent">
      {/* Global Campus Search Bar matching mockup */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 stroke-[2]" />
          </div>
          <input
            type="text"
            placeholder="Search for books, calculators, laptops..."
            className="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-200/70 rounded-full text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Bell + Divider + User Profile Pill */}
      <div className="flex items-center gap-5">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-800 hover:text-black transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[1.8]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E53E3E] rounded-full ring-2 ring-[#FDFBF9]"></span>
          </button>

          {/* Quick Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-card border border-slate-100 p-4 space-y-2.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Campus Alerts</span>
                <span className="text-[11px] font-semibold text-brand-yellow-600">2 Unread</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/80 text-xs text-amber-900">
                <div className="font-bold">Identity Verified!</div>
                <div className="text-[11px] text-slate-600">Your student membership is active for VNRVJIET.</div>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider Line matching mockup */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile Pill matching mockup */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-[#061C3D] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {initial}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-[#061C3D] leading-tight">
                {displayName}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold leading-tight flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-500" />
                <span>{roleLabel}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition-colors" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-card border border-slate-100 p-3 space-y-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{displayName}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email || 'sai.reddy@vnrvjiet.in'}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>VNRVJIET Verified</span>
                </div>
              </div>

              {user?.is_staff && (
                <Link
                  to="/admin/verifications"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 transition-colors"
                >
                  🛡️ Admin Verifications
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
