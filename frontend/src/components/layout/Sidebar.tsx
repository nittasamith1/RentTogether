import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  Package,
  Layers,
  Calendar,
  Sparkles,
  BarChart2,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import sidebarWaveImg from '../../assets/sidebar_wave.png';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Explore', path: '/explore', icon: Search },
  { name: 'My Rentals', path: '/rentals', icon: Package },
  { name: 'My Listings', path: '/listings', icon: Layers },
  { name: 'Bookings', path: '/bookings', icon: Calendar },
  { name: 'AI Insights', path: '/ai-insights', icon: Sparkles },
  { name: 'Sustainability', path: '/sustainability', icon: BarChart2 },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-[#061C3D] text-slate-300 flex flex-col justify-between shrink-0 relative overflow-hidden select-none">
      {/* Top Section */}
      <div className="relative z-10 pt-6">
        {/* Brand Logo matching mockup: Rent in White + Together in Yellow */}
        <div className="px-6 flex items-center gap-3 pb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-yellow flex items-center justify-center text-brand-navy shadow-sm">
            <svg
              className="w-5 h-5 text-brand-navy"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
              <circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div className="text-xl font-bold tracking-tight">
            <span className="text-white font-black">Rent</span>
            <span className="text-brand-yellow font-black">Together</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-yellow text-brand-navy font-bold shadow-md shadow-brand-yellow/20'
                      : 'text-slate-300/80 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-brand-navy fill-brand-navy stroke-[2.2]'
                          : 'text-slate-300/80'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Admin Verifications Link (if user has admin rights) */}
          {user?.is_staff && (
            <NavLink
              to="/admin/verifications"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-yellow text-brand-navy font-bold shadow-md shadow-brand-yellow/20'
                    : 'text-indigo-300/90 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-brand-navy' : 'text-indigo-400'
                    }`}
                  />
                  <span>ID Verifications</span>
                </>
              )}
            </NavLink>
          )}

          {/* Thin Divider Line matching mockup */}
          <div className="pt-2 pb-1">
            <div className="h-px bg-slate-700/60 mx-1" />
          </div>

          {/* Settings Nav Item */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-brand-yellow text-brand-navy font-bold'
                  : 'text-slate-300/80 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Settings className="w-4 h-4 shrink-0 text-slate-300/80" />
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* Signature Brand Overlapping Curved Wave at Bottom Left (Exact Mockup Match) */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none select-none overflow-hidden z-0">
        <img
          src={sidebarWaveImg}
          alt=""
          className="w-full h-full object-cover object-bottom"
        />
      </div>
    </aside>
  );
};
