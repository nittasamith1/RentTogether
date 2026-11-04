import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Store,
  ArrowRight,
  AlignLeft,
  Calendar,
  CreditCard,
  BarChart2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutGrid },
  { name: 'Marketplace', path: '/marketplace', icon: Store },
  { name: 'My Rentals', path: '/rentals', icon: ArrowRight },
  { name: 'My Listings', path: '/listings', icon: AlignLeft },
  { name: 'My Bookings', path: '/bookings', icon: Calendar },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Insights', path: '/insights', icon: BarChart2 },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-100/90 text-slate-600 flex flex-col justify-between shrink-0 relative select-none py-6 z-20">
      {/* Top Branding & Navigation */}
      <div>
        {/* Brand Logo matching the screenshot */}
        <div className="px-6 flex items-center gap-3 pb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B4DFF] to-[#7C3AED] flex items-center justify-center text-white shadow-sm shadow-indigo-500/25">
            <svg
              className="w-4.5 h-4.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 17H7A5 5 0 0 1 7 7h2" />
              <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1E1B4B]">
            RentTogether
          </span>
        </div>

        {/* Navigation List */}
        <nav className="px-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#5B4DFF] text-white font-bold shadow-md shadow-indigo-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 stroke-[2] ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Admin Link if staff */}
          {user?.is_staff && (
            <NavLink
              to="/admin/verifications"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#5B4DFF] text-white font-bold shadow-md shadow-indigo-500/25'
                    : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 stroke-[2] ${
                      isActive ? 'text-white' : 'text-indigo-500'
                    }`}
                  />
                  <span>Verifications</span>
                </>
              )}
            </NavLink>
          )}
        </nav>
      </div>

      {/* Bottom Tagline matching screenshot */}
      <div className="px-6 pt-6 border-t border-slate-100/80">
        <div className="text-xs font-bold text-[#E11D48] tracking-tight">
          Share Smart.
        </div>
        <div className="text-xs font-medium text-slate-400 mt-0.5">
          Save More. Live Better.
        </div>
      </div>
    </aside>
  );
};
