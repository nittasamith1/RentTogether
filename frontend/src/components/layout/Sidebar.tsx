import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Store,
  Package,
  Layers,
  Calendar,
  CreditCard,
  BarChart2,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { CampusNetworkCard } from '../common/CampusNetworkCard';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutGrid },
  { name: 'Marketplace', path: '/marketplace', icon: Store },
  { name: 'My Rentals', path: '/rentals', icon: Package },
  { name: 'My Listings', path: '/listings', icon: Layers },
  { name: 'Bookings & Calendar', path: '/bookings', icon: Calendar },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Profile', path: '/profile', icon: User },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const collegeName = user?.college_name || 'Aditya University';
  const collegeCode = user?.college_code || 'ADITYA';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#303653]/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        aria-label="Main Navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between shrink-0 select-none py-5 transition-[width,transform] duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen
            ? 'w-72 max-w-[85vw] translate-x-0 shadow-2xl lg:w-64 lg:shadow-none'
            : '-translate-x-full lg:w-20 lg:shadow-none'
        }`}
        style={{ backgroundColor: '#E9E3FF', borderRight: '1px solid #D8D0F5' }}
      >
        {/* Top Header & Navigation Links */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Logo & Mobile Close Header */}
          <div
            className={`pb-6 flex items-center transition-all duration-300 ${
              isOpen ? 'px-5 justify-between' : 'px-2 justify-center'
            }`}
          >
            <NavLink
              to="/"
              onClick={onClose}
              className="inline-flex items-center gap-3 transition-opacity hover:opacity-90"
              title="RentTogether Campus Sharing"
            >
              {isOpen ? (
                <Logo size="md" showText={true} />
              ) : (
                <Logo size="sm" showText={false} />
              )}
            </NavLink>

            {/* Mobile close button */}
            {isOpen && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[#D8D0F5] text-[#303653] lg:hidden cursor-pointer transition-colors"
                aria-label="Close navigation sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links List */}
          <nav className={`space-y-1.5 transition-all duration-300 ${isOpen ? 'px-3' : 'px-2'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  title={!isOpen ? item.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl font-semibold transition-all duration-200 cursor-pointer ${
                      isOpen
                        ? 'gap-3 px-4 py-2.5 text-sm'
                        : 'justify-center p-2.5 mx-auto w-11 h-11'
                    } ${
                      isActive
                        ? 'bg-[#7563D9] text-white shadow-md'
                        : 'text-[#303653] hover:bg-[#D8D0F5] hover:text-[#7563D9]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`shrink-0 stroke-[2] ${
                          isOpen ? 'w-4 h-4' : 'w-5 h-5'
                        } ${isActive ? 'text-white' : 'text-[#7563D9]'}`}
                      />
                      {isOpen && (
                        <span className="truncate text-sm">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Staff Admin Verifications */}
            {user?.is_staff && (
              <NavLink
                to="/admin/verifications"
                onClick={onClose}
                title={!isOpen ? 'Verifications' : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl font-semibold transition-all duration-200 cursor-pointer ${
                    isOpen
                      ? 'gap-3 px-4 py-2.5 text-sm'
                      : 'justify-center p-2.5 mx-auto w-11 h-11'
                  } ${
                    isActive
                      ? 'bg-[#7563D9] text-white shadow-md'
                      : 'text-[#7563D9] hover:bg-[#D8D0F5]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <ShieldCheck
                      className={`shrink-0 stroke-[2] ${
                        isOpen ? 'w-4 h-4' : 'w-5 h-5'
                      } ${isActive ? 'text-white' : 'text-[#7563D9]'}`}
                    />
                    {isOpen && (
                      <span className="truncate text-sm">Verifications</span>
                    )}
                  </>
                )}
              </NavLink>
            )}
          </nav>
        </div>

        {/* Bottom Campus Network Footer */}
        <div
          className={`shrink-0 transition-all duration-300 ${
            isOpen ? 'px-3 pt-4' : 'px-2 pt-3 flex justify-center'
          }`}
          style={{ borderTop: '1px solid #D0C8F0' }}
        >
          {isOpen ? (
            <CampusNetworkCard collegeName={collegeName} collegeCode={collegeCode} />
          ) : (
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs relative cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: '#7563D9' }}
              title={`${collegeName} (${collegeCode}) - Verified Single-Campus Network`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#E9E3FF]" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
