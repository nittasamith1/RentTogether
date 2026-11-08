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

  const displayName = user?.name || user?.first_name || 'Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header
      className="h-16 px-8 flex items-center justify-between gap-6 shrink-0 relative z-30 border-b"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#85899B' }}>
            <Search className="w-4 h-4 stroke-[2]" />
          </div>
          <input
            type="text"
            placeholder="Search calculators, books, lab gear"
            className="w-full pl-11 pr-5 py-2.5 rounded-full text-xs placeholder-[#85899B] focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: '#FFF8ED',
              border: '1px solid #EAE6E1',
              color: '#303653',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#7563D9';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(117,99,217,0.12)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#EAE6E1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#E9E3FF', color: '#7563D9', border: '1px solid #D8D0F5' }}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-3 w-72 rounded-2xl shadow-card border p-4 space-y-2.5 z-50"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              <div className="flex items-center justify-between pb-1.5" style={{ borderBottom: '1px solid #EAE6E1' }}>
                <span className="text-xs font-bold" style={{ color: '#303653' }}>Campus Alerts</span>
                <span className="text-[11px] font-semibold" style={{ color: '#7563D9' }}>2 Unread</span>
              </div>
              <div className="p-2.5 rounded-xl text-xs space-y-0.5" style={{ backgroundColor: '#E9E3FF' }}>
                <div className="font-bold" style={{ color: '#303653' }}>Booking Request Confirmed!</div>
                <div className="text-[11px]" style={{ color: '#85899B' }}>Casio fx-991EX rental is ready for pickup today.</div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="rounded-full py-1.5 pl-2 pr-3.5 flex items-center gap-2.5 transition-all cursor-pointer"
            style={{ backgroundColor: '#FFFCF7', border: '1px solid #EAE6E1' }}
          >
            <div
              className="w-8 h-8 rounded-full font-black text-sm flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#7563D9', color: '#fff' }}
            >
              {initial}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold leading-tight" style={{ color: '#303653' }}>
                {displayName}
              </div>
              <div className="text-[10px] font-semibold leading-tight" style={{ color: '#42A879' }}>
                Verified student
              </div>
            </div>
            <ChevronDown className="w-3 h-3 ml-0.5" style={{ color: '#85899B' }} />
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-3 w-56 rounded-2xl shadow-card border p-3 space-y-2 z-50"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              <div className="pb-2" style={{ borderBottom: '1px solid #EAE6E1' }}>
                <div className="text-xs font-bold" style={{ color: '#303653' }}>{displayName}</div>
                <div className="text-[11px] truncate" style={{ color: '#85899B' }}>{user?.email}</div>
                <div
                  className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border"
                  style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>{user?.college_name || 'University'} Verified</span>
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="block px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ color: '#303653' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F2FF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                👤 Student Profile & Scores
              </Link>

              {user?.is_staff && (
                <Link
                  to="/admin/verifications"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ color: '#7563D9', backgroundColor: '#E9E3FF' }}
                >
                  🛡️ Admin Verifications
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                style={{ color: '#E87575' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF0F0')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
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
