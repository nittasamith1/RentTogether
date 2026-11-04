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
  Boxes,
} from 'lucide-react';

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
    <aside className="w-64 bg-brand-navy-950 text-slate-300 flex flex-col justify-between shrink-0 relative overflow-hidden select-none">
      <div>
        {/* Brand Logo */}
        <div className="h-20 px-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-yellow flex items-center justify-center text-brand-navy-950 shadow-md">
            <Boxes className="w-5 h-5 text-brand-navy-950" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            RentTogether
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="px-4 py-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-yellow text-brand-navy-950 font-bold shadow-md shadow-brand-yellow/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section with Settings and Decorative Wave */}
      <div className="relative z-10 px-4 pb-8">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-yellow text-brand-navy-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </NavLink>

        {/* Brand Corner Accent Glow */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 text-center">
          RentTogether V1 · Campus Edition
        </div>
      </div>

      {/* Decorative Wave from Dashboard Mockup */}
      <div className="absolute -bottom-8 -left-8 w-44 h-44 rounded-full bg-gradient-to-tr from-brand-red via-brand-yellow to-transparent opacity-30 blur-2xl pointer-events-none" />
    </aside>
  );
};
