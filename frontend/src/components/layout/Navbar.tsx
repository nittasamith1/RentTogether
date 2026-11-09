import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Bell,
  Heart,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
  CheckCheck,
  Inbox,
  Loader2,
  X,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useDebounce } from '../../hooks/useDebounce';
import { marketplaceService } from '../../services/marketplace';

interface NavbarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarOpen = false,
  onToggleSidebar,
  onOpenMobileMenu,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const debouncedHeaderSearch = useDebounce(headerSearch, 350);

  // Sync header search with URL query when on marketplace
  useEffect(() => {
    if (location.pathname === '/marketplace') {
      const q = searchParams.get('search') || '';
      setHeaderSearch(q);
    }
  }, [location.pathname, searchParams]);

  // When on marketplace, live-filter as the user types
  useEffect(() => {
    if (location.pathname === '/marketplace') {
      const currentParam = searchParams.get('search') || '';
      const nextVal = debouncedHeaderSearch.trim();
      if (nextVal !== currentParam) {
        const nextParams = new URLSearchParams(searchParams);
        if (nextVal) {
          nextParams.set('search', nextVal);
        } else {
          nextParams.delete('search');
        }
        nextParams.set('page', '1');
        navigate(`/marketplace?${nextParams.toString()}`, { replace: true });
      }
    }
  }, [debouncedHeaderSearch, location.pathname]);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerSearch.trim();
    if (location.pathname === '/marketplace') {
      const nextParams = new URLSearchParams(searchParams);
      if (q) {
        nextParams.set('search', q);
      } else {
        nextParams.delete('search');
      }
      nextParams.set('page', '1');
      navigate(`/marketplace?${nextParams.toString()}`);
    } else {
      if (q) {
        navigate(`/marketplace?search=${encodeURIComponent(q)}`);
      } else {
        navigate('/marketplace');
      }
    }
  };

  const handleClearHeaderSearch = () => {
    setHeaderSearch('');
    if (location.pathname === '/marketplace') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('search');
      nextParams.set('page', '1');
      navigate(`/marketplace${nextParams.toString() ? `?${nextParams.toString()}` : ''}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClearHeaderSearch();
    }
  };

  const {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
    deleteNotification,
    clearNotifications,
    isClearing: isClearingNotifications,
  } = useNotifications();

  const { data: wishlistData } = useQuery({
    queryKey: ['marketplace-wishlist', 1, ''],
    queryFn: () => marketplaceService.getWishlist(1, ''),
    enabled: Boolean(user),
    staleTime: 1000 * 60 * 2,
  });
  const wishlistCount = wishlistData?.count || 0;

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  const handleNotificationClick = (item: any) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    setShowNotifications(false);
    if (item.action_url) {
      navigate(item.action_url);
    } else if (item.notification_type?.includes('BOOKING') || item.notification_type?.includes('CASH') || item.notification_type?.includes('HANDOVER')) {
      navigate('/rentals');
    } else if (item.notification_type?.includes('LISTING')) {
      navigate('/my-listings');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.name || user?.first_name || 'Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header
      className="h-16 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2.5 sm:gap-6 shrink-0 relative z-30 border-b"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
    >
      {/* Left: Menu Toggle Button & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <button
          onClick={onToggleSidebar || onOpenMobileMenu}
          className="p-2 rounded-xl border hover:bg-black/5 text-[#303653] cursor-pointer shrink-0 transition-all active:scale-95 duration-150"
          style={{
            backgroundColor: isSidebarOpen ? '#E9E3FF' : '#FFFCF7',
            borderColor: isSidebarOpen ? '#D8D0F5' : '#EAE6E1',
            color: isSidebarOpen ? '#7563D9' : '#303653',
          }}
          aria-label={isSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
          aria-expanded={isSidebarOpen}
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Search Bar with Submit & Clear */}
        <form onSubmit={handleHeaderSearch} className="flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg min-w-0">
          <div className="relative">
            <button
              type="submit"
              className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center cursor-pointer hover:text-[#7563D9] transition-colors"
              style={{ color: '#85899B' }}
              title="Search"
              aria-label="Submit search"
            >
              <Search className="w-4 h-4 stroke-[2]" />
            </button>
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search campus gear, tools, calculators..."
              className="w-full pl-9 sm:pl-11 pr-8 sm:pr-9 py-2 sm:py-2.5 rounded-full text-xs placeholder-[#85899B] focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: '#FFF8ED',
                border: '1px solid #EAE6E1',
                color: '#303653',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#7563D9';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(117,99,217,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EAE6E1';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {headerSearch && (
              <button
                type="button"
                onClick={handleClearHeaderSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-[#85899B] hover:text-[#303653]"
                aria-label="Clear search"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Wishlist Button (Love Symbol Only) */}
        <button
          onClick={() => navigate('/wishlist')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 duration-150 shadow-2xs shrink-0 relative"
          style={{ backgroundColor: '#FFE5D6', color: '#F28B82', border: '1px solid #F5CDB8' }}
          title={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} saved)` : ''}`}
          aria-label="Wishlist"
        >
          <Heart className="w-4 h-4 fill-[#F28B82] stroke-[2]" />
          {wishlistCount > 0 && (
            <span
              className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-black text-white shadow-xs animate-in zoom-in-75 duration-150 flex items-center justify-center min-w-4.5 h-4.5"
              style={{ backgroundColor: '#7563D9' }}
            >
              {wishlistCount > 9 ? '9+' : wishlistCount}
            </span>
          )}
        </button>

        {/* Bell Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 relative"
            style={{ backgroundColor: '#E9E3FF', color: '#7563D9', border: '1px solid #D8D0F5' }}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-black text-white shadow-xs animate-in zoom-in-75 duration-150 flex items-center justify-center min-w-4.5 h-4.5"
                style={{ backgroundColor: '#F28B82' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl shadow-xl border p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              {/* Dropdown Header */}
              <div className="flex flex-col gap-2 pb-2.5" style={{ borderBottom: '1px solid #EAE6E1' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#303653' }}>
                      Campus Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: '#FFE5D6', color: '#C45C20' }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        disabled={isMarkingAllRead}
                        className="text-[11px] font-bold flex items-center gap-1 transition-opacity cursor-pointer hover:underline disabled:opacity-50"
                        style={{ color: '#7563D9' }}
                        title="Mark all notifications as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mark read</span>
                      </button>
                    )}

                    {notifications.some((n: any) => n.is_read) && (
                      <button
                        onClick={() => clearNotifications('read')}
                        disabled={isClearingNotifications}
                        className="text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer hover:text-[#E87575] disabled:opacity-50"
                        style={{ color: '#85899B' }}
                        title="Clear read alerts from database storage"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear read</span>
                      </button>
                    )}

                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Clear all notification history from the database to reclaim storage?')) {
                            clearNotifications('all');
                          }
                        }}
                        disabled={isClearingNotifications}
                        className="text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer hover:text-[#E87575] disabled:opacity-50"
                        style={{ color: '#85899B' }}
                        title="Clear all alerts and reclaim database storage"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Clear all</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Notification List / Body */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5 overscroll-contain">
                {isLoadingNotifications ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs" style={{ color: '#85899B' }}>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#7563D9' }} />
                    <span>Loading alerts...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center p-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2"
                      style={{ backgroundColor: '#FFF8ED', color: '#85899B' }}
                    >
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold" style={{ color: '#303653' }}>
                      All caught up!
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#85899B' }}>
                      No new activity or booking requests right now.
                    </p>
                  </div>
                ) : (
                  notifications.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className="p-3 rounded-xl text-xs space-y-1 cursor-pointer transition-all border relative group"
                      style={{
                        backgroundColor: item.is_read ? '#FFFCF7' : '#E9E3FF',
                        borderColor: item.is_read ? '#EAE6E1' : '#D8D0F5',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold leading-tight pr-6" style={{ color: '#303653' }}>
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-medium" style={{ color: '#85899B' }}>
                            {formatTimeAgo(item.created_at)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(item.id);
                            }}
                            className="p-1 rounded-md text-[#85899B] hover:text-[#E87575] hover:bg-black/5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete this alert to free storage"
                            aria-label="Delete alert"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: '#555A6E' }}>
                        {item.body}
                      </p>
                      {!item.is_read && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full absolute top-2 right-2"
                          style={{ backgroundColor: '#7563D9' }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              {notifications.length > 0 && (
                <div
                  className="pt-2 flex items-center justify-between text-[10px] text-[#85899B]"
                  style={{ borderTop: '1px solid #EAE6E1' }}
                >
                  <span>{notifications.length} total alert{notifications.length > 1 ? 's' : ''} stored</span>
                  <span className="text-[#42A879] font-medium">Reclaim storage anytime</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="rounded-full py-1 sm:py-1.5 pl-1.5 sm:pl-2 pr-2 sm:pr-3.5 flex items-center gap-1.5 sm:gap-2.5 transition-all cursor-pointer hover:bg-black/5"
            style={{ backgroundColor: '#FFFCF7', border: '1px solid #EAE6E1' }}
          >
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs"
              style={{ backgroundColor: '#7563D9', color: '#fff' }}
            >
              {initial}
            </div>
            <div className="text-left hidden md:block">
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
              className="absolute right-0 mt-3 w-56 sm:w-64 max-w-[calc(100vw-24px)] rounded-2xl shadow-card border p-3 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              <div className="pb-2" style={{ borderBottom: '1px solid #EAE6E1' }}>
                <div className="text-xs font-bold truncate" style={{ color: '#303653' }}>{displayName}</div>
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
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
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
