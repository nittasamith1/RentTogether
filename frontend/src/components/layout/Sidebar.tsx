import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Compass,
  Package,
  Layers,
  CalendarDays,
  Sparkles,
  BarChart3,
  Settings,
} from 'lucide-react';
import sidebarWaveImg from '../../assets/sidebar_wave.png';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Explore', path: '/explore', icon: Compass },
  { name: 'My Rentals', path: '/rentals', icon: Package },
  { name: 'My Listings', path: '/listings', icon: Layers },
  { name: 'Bookings', path: '/bookings', icon: CalendarDays },
  { name: 'AI Insights', path: '/ai-insights', icon: Sparkles },
  { name: 'Sustainability', path: '/sustainability', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-brand-navy-950 text-slate-300 flex flex-col justify-between shrink-0 relative overflow-hidden select-none border-r border-slate-900">
      {/* Top Section */}
      <div className="relative z-10">
        {/* Brand Logo with Isometric Cube Icon */}
        <div className="h-20 px-6 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center text-brand-navy-950 shadow-glow-sm transition-transform hover:scale-105">
            <svg
              className="w-5 h-5 text-brand-navy-950"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white font-display">
            RentTogether
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 py-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-yellow text-brand-navy-950 shadow-md shadow-brand-yellow/20 font-bold translate-x-1'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? 'text-brand-navy-950 stroke-[2.5]'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Settings Navigation Link */}
      <div className="relative z-10 px-4 mb-28">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-brand-yellow text-brand-navy-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
            }`
          }
        >
          <Settings className="w-4 h-4 transition-transform duration-200 group-hover:rotate-45" />
          <span>Settings</span>
        </NavLink>
      </div>

      {/* Signature Brand Overlapping Curved Wave at Bottom Left (Exact Mockup Match) */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none select-none overflow-hidden z-0">
        <img
          src={sidebarWaveImg}
          alt=""
          className="w-full h-full object-cover object-bottom"
        />
      </div>
    </aside>
  );
};
