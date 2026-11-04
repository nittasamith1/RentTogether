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
import { Logo } from '../common/Logo';
import { CampusNetworkCard } from '../common/CampusNetworkCard';

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
        {/* Authentic Brand Logo matching user reference image */}
        <div className="px-6 pb-8 flex items-center">
          <NavLink to="/" className="inline-block">
            <Logo size="md" />
          </NavLink>
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

      {/* Bottom Campus Network Widget with Image 1 styling */}
      <div className="px-3 pt-4 border-t border-slate-100/80">
        <CampusNetworkCard
          collegeName={user?.college_name || 'Aditya University'}
          collegeCode={user?.college_code || 'ADITYA'}
        />
      </div>
    </aside>
  );
};
