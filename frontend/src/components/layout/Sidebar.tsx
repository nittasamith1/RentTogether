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
  User,
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
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Profile', path: '/profile', icon: User },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside
      className="w-64 flex flex-col justify-between shrink-0 relative select-none py-5 z-20"
      style={{ backgroundColor: '#E9E3FF', borderRight: '1px solid #D8D0F5' }}
    >
      {/* Logo */}
      <div>
        <div className="px-5 pb-7 flex items-center">
          <NavLink to="/" className="inline-block">
            <Logo size="md" />
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#7563D9] text-white shadow-md'
                      : 'text-[#303653] hover:bg-[#D8D0F5] hover:text-[#7563D9]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 stroke-[2] ${
                        isActive ? 'text-white' : 'text-[#7563D9]'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {user?.is_staff && (
            <NavLink
              to="/admin/verifications"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#7563D9] text-white shadow-md'
                    : 'text-[#7563D9] hover:bg-[#D8D0F5]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 stroke-[2] ${
                      isActive ? 'text-white' : 'text-[#7563D9]'
                    }`}
                  />
                  <span>Verifications</span>
                </>
              )}
            </NavLink>
          )}
        </nav>
      </div>

      {/* Bottom Campus Network Card */}
      <div className="px-3 pt-4" style={{ borderTop: '1px solid #D0C8F0' }}>
        <CampusNetworkCard
          collegeName={user?.college_name || 'Aditya University'}
          collegeCode={user?.college_code || 'ADITYA'}
        />
      </div>
    </aside>
  );
};
