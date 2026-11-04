import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
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
  const initial = displayName.charAt(0).toUpperCase() || 'S';

  return (
    <header className="h-20 px-8 flex items-center justify-between gap-6 shrink-0 relative z-30 bg-transparent">
      {/* Global Campus Search Bar matching reference */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 stroke-[2]" />
          </div>
          <input
            type="text"
            placeholder="Search calculators, books, lab gear"
            className="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-200/80 rounded-full text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Bell + Verified Student Profile Pill */}
      <div className="flex items-center gap-3.5">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Quick Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-card border border-slate-100 p-4 space-y-2.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Campus Alerts</span>
                <span className="text-[11px] font-semibold text-indigo-600">2 Unread</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50/70 text-xs text-indigo-900 space-y-0.5">
                <div className="font-bold">Booking Request Confirmed!</div>
                <div className="text-[11px] text-slate-600">Casio fx-991EX rental is ready for pickup today.</div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill matching screenshot */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="bg-white border border-slate-200/80 rounded-full py-1.5 pl-2 pr-3.5 flex items-center gap-2.5 shadow-xs hover:bg-slate-50 transition-all cursor-pointer group"
          >
            {/* Initial Circle in warm amber */}
            <div className="w-8 h-8 rounded-full bg-[#FDBC1F] text-[#061C3D] font-black text-sm flex items-center justify-center shadow-xs shrink-0">
              {initial}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {displayName}
              </div>
              <div className="text-[10px] font-semibold text-emerald-600 leading-tight">
                Verified student
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors ml-0.5" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-card border border-slate-100 p-3 space-y-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{displayName}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email || 'sai.reddy@adityauniversity.in'}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Aditya University Verified</span>
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="block px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                👤 Student Profile & Scores
              </Link>

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
