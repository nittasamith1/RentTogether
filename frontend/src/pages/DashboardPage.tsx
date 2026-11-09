import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  Clock,
  Calendar,
  Package,
  Plus,
  Flame,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMyRentals, useMyIncomingRequests } from '../hooks/useBookings';
import { useMyListings } from '../hooks/useListings';
import { useProfile } from '../hooks/useProfile';
import { useWishlist } from '../hooks/useWishlist';
import { marketplaceService, ItemSummary } from '../services/marketplace';
import { ItemDetailModal } from '../components/marketplace/ItemDetailModal';
import { ItemCardSkeleton } from '../components/common/Skeleton';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleWishlist } = useWishlist();
  const displayName = user?.first_name || user?.name?.split(' ')[0] || 'Student';
  const collegeName = user?.college_name || 'Aditya University';

  // 1. Real Queries for Dashboard Data
  const { data: rentalsData, isLoading: loadingRentals } = useMyRentals();
  const { data: incomingData, isLoading: loadingIncoming } = useMyIncomingRequests();
  const { data: myListingsData, isLoading: loadingListings } = useMyListings();
  const { data: profile } = useProfile();

  const { data: popularItems = [], isLoading: loadingPopular } = useQuery<ItemSummary[]>({
    queryKey: ['popular-items-dashboard'],
    queryFn: () => marketplaceService.getPopularItems(),
    staleTime: 1000 * 60 * 5,
  });

  // State
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Calculations
  const totalRentals = rentalsData?.count || 0;
  const activeRentalsCount =
    rentalsData?.results?.filter(
      (r) => r.status === 'ACTIVE' || r.status === 'PAID_CONFIRMED'
    ).length || 0;

  const totalListings = myListingsData?.stats?.total_listings || 0;
  const activeListingsCount = myListingsData?.stats?.active_listings || 0;

  const pendingIncomingCount =
    incomingData?.results?.filter((r) => r.status === 'PENDING_APPROVAL').length || 0;

  const savingsAmount = Math.round(Number(profile?.total_savings_inr || 0));

  // Active / Pending action bookings (combining renter & owner)
  const actionBookings = [
    ...(incomingData?.results || []).map((b) => ({ ...b, role: 'OWNER' as const })),
    ...(rentalsData?.results || []).map((b) => ({ ...b, role: 'RENTER' as const })),
  ]
    .filter((b) =>
      ['PENDING_APPROVAL', 'APPROVED_PENDING_PAYMENT', 'PAID_CONFIRMED', 'ACTIVE', 'RETURNED_PENDING_INSPECTION'].includes(
        b.status
      )
    )
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none pt-2">
      {/* 1. Hero Welcome Banner — Soft Gradient */}
      <div
        className="relative rounded-3xl overflow-hidden text-white p-5 sm:p-8 md:p-9 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #7563D9 0%, #6552C5 50%, #5A42B8 100%)' }}
      >
        <div className="absolute -right-10 -top-10 w-72 h-72 pointer-events-none select-none hidden md:block">
          <svg viewBox="0 0 300 300" className="w-full h-full opacity-20">
            <circle cx="120" cy="80" r="80" fill="white" />
            <circle cx="220" cy="160" r="60" fill="white" />
            <circle cx="260" cy="80" r="40" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 max-w-xl space-y-3.5">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'rgba(255,255,255,0.20)', color: 'rgba(255,255,255,0.95)' }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{collegeName} Campus Network</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
            Hello, {displayName}! Share smart. Save more. Live better.
          </h1>

          <p className="text-xs text-white/85 leading-relaxed">
            Borrow essential academic gear, lab tools, and electronics from fellow students at {collegeName} with escrow protection.
          </p>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 pt-1">
            <button
              onClick={() => navigate('/listings/create')}
              className="px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
              style={{ backgroundColor: '#fff', color: '#7563D9' }}
            >
              <Plus className="w-4 h-4" />
              <span>List an item</span>
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-5 py-2.5 rounded-2xl font-semibold text-xs transition-all active:scale-95 cursor-pointer border border-white/30 w-full sm:w-auto text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              Explore Campus Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real-Time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Rentals — Soft Lavender */}
        <div
          onClick={() => navigate('/rentals')}
          className="rounded-3xl p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#7563D9' }}>
              <Package className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#7563D9]" />
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold" style={{ color: '#7563D9' }}>My Rentals</div>
            <div className="text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              {loadingRentals ? '...' : totalRentals}
            </div>
            <div className="text-[11px] font-medium mt-1 flex items-center gap-1" style={{ color: '#5B48B8' }}>
              <Clock className="w-3 h-3" />
              <span>{activeRentalsCount} active rentals</span>
            </div>
          </div>
        </div>

        {/* Card 2: My Listings — Sky Blue */}
        <div
          onClick={() => navigate('/listings')}
          className="rounded-3xl p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6398D6' }}>
              <Layers className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#6398D6]" />
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold" style={{ color: '#3A6BB5' }}>My Equipment Listings</div>
            <div className="text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              {loadingListings ? '...' : totalListings}
            </div>
            <div className="text-[11px] font-medium mt-1 flex items-center gap-1" style={{ color: '#3A6BB5' }}>
              <CheckCircle2 className="w-3 h-3" />
              <span>{activeListingsCount} discoverable now</span>
            </div>
          </div>
        </div>

        {/* Card 3: Incoming Requests — Fresh Mint */}
        <div
          onClick={() => navigate('/bookings')}
          className="rounded-3xl p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#42A879' }}>
              <Calendar className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            {pendingIncomingCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: '#E8A447' }}
              >
                Needs Review
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold" style={{ color: '#2D7A5B' }}>Incoming Requests</div>
            <div className="text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              {loadingIncoming ? '...' : pendingIncomingCount}
            </div>
            <div className="text-[11px] font-medium mt-1" style={{ color: '#2D7A5B' }}>
              {pendingIncomingCount > 0 ? `${pendingIncomingCount} pending your approval` : 'All caught up'}
            </div>
          </div>
        </div>

        {/* Card 4: Campus Savings — Soft Peach */}
        <div
          onClick={() => navigate('/analytics')}
          className="rounded-3xl p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white" style={{ backgroundColor: '#C45C20' }}>
              ₹
            </div>
            <ArrowRight className="w-4 h-4 text-[#C45C20]" />
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold" style={{ color: '#C45C20' }}>Campus Savings</div>
            <div className="text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              ₹{savingsAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-medium mt-1" style={{ color: '#C45C20' }}>
              Compared to retail purchases
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real Active Bookings & Campus Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Active Bookings (7 col) */}
        <div
          className="lg:col-span-7 rounded-3xl p-6 border shadow-xs flex flex-col justify-between"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#EAE6E1' }}>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#303653' }}>
                Active Bookings & Pending Actions
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
                Real-time lifecycle status for equipment borrowed and lent.
              </p>
            </div>
            <Link to="/bookings" className="text-xs font-bold transition-colors" style={{ color: '#7563D9' }}>
              View Bookings →
            </Link>
          </div>

          <div className="space-y-3 pt-3 flex-1 flex flex-col justify-center">
            {actionBookings.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
                >
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold" style={{ color: '#303653' }}>
                  No active rental handovers right now
                </h4>
                <p className="text-xs text-[#85899B] max-w-sm mx-auto">
                  Browse items on campus to borrow, or list equipment you own to start earning.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: '#7563D9' }}
                  >
                    Browse Marketplace
                  </button>
                </div>
              </div>
            ) : (
              actionBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center bg-white"
                      style={{ borderColor: '#EAE6E1' }}
                    >
                      {b.item_thumbnail ? (
                        <img src={b.item_thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-[#85899B]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-[#7563D9]">
                          {b.booking_code}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#E9E3FF] text-[#7563D9]">
                          {b.role === 'OWNER' ? 'You Lend' : 'You Borrow'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold truncate mt-0.5" style={{ color: '#303653' }}>
                        {b.item_title}
                      </h4>
                      <p className="text-[11px] truncate" style={{ color: '#85899B' }}>
                        {b.role === 'OWNER' ? `Renter: ${b.renter_name}` : `Owner: ${b.owner_name}`} • {b.start_date} → {b.end_date}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#EAE6E1]">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                      style={
                        b.status === 'PENDING_APPROVAL'
                          ? { backgroundColor: '#FFF3DC', color: '#B07000', borderColor: '#F5D68A' }
                          : b.status === 'APPROVED_PENDING_PAYMENT'
                            ? { backgroundColor: '#FFE5D6', color: '#C45C20', borderColor: '#F5CDB8' }
                            : b.status === 'ACTIVE'
                              ? { backgroundColor: '#DDF3E7', color: '#2D7A5B', borderColor: '#B8E5CC' }
                              : { backgroundColor: '#E9E3FF', color: '#7563D9', borderColor: '#D8D0F5' }
                      }
                    >
                      {b.status.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => navigate('/bookings')}
                      className="p-1.5 rounded-xl hover:bg-white text-[#7563D9] transition-all cursor-pointer"
                      title="Manage booking"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Campus Intelligence (5 col) */}
        <div
          className="lg:col-span-5 rounded-3xl p-6 border shadow-xs flex flex-col justify-between"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: '#D0C8F0' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7563D9]" />
              <h2 className="text-sm font-bold" style={{ color: '#303653' }}>
                AI Campus Intelligence
              </h2>
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: '#7563D9' }}
            >
              Live Insights
            </span>
          </div>

          <div className="space-y-3 my-3">
            <div className="p-3.5 rounded-2xl border bg-white" style={{ borderColor: '#EAE6E1' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: '#303653' }}>
                  Fair Price Recommendation
                </span>
                <span className="text-[10px] font-bold font-mono text-[#42A879]">
                  AI Trained Model
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#85899B' }}>
                Our ML pricing engine evaluates item age, condition, and purchase cost to recommend optimal daily rates and security deposits for {collegeName}.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border bg-white" style={{ borderColor: '#EAE6E1' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: '#303653' }}>
                  Zero-Hassle Campus Escrow
                </span>
                <span className="text-[10px] font-bold font-mono text-[#6398D6]">
                  100% Protected
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#85899B' }}>
                Security deposits are held in a segregated college vault and auto-refund upon post-return inspection without peer dispute risk.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs border-t" style={{ borderColor: '#D0C8F0' }}>
            <button
              onClick={() => navigate('/listings/create')}
              className="font-bold flex items-center gap-1 cursor-pointer text-[#7563D9] hover:underline"
            >
              <span>+ List equipment now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <Link to="/analytics" className="font-semibold text-[#6552C5] hover:underline">
              View Analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Real Popular / Trending Items on Campus */}
      <div
        className="rounded-3xl p-6 border shadow-xs space-y-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-white shadow-xs" style={{ backgroundColor: '#7563D9' }}>
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#303653' }}>
                Popular on Your Campus ({collegeName})
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
                Verified academic gear, electronics, and lab equipment shared by fellow students.
              </p>
            </div>
          </div>
          <Link
            to="/marketplace"
            className="text-xs font-bold text-[#7563D9] flex items-center gap-1 hover:underline"
          >
            <span>Explore all items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingPopular ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {[1, 2, 3, 4].map((n) => (
              <ItemCardSkeleton key={n} />
            ))}
          </div>
        ) : popularItems.length === 0 ? (
          <div className="p-10 text-center space-y-3 bg-[#FFF8ED] rounded-2xl border border-[#EAE6E1]">
            <Package className="w-10 h-10 text-[#85899B] mx-auto" />
            <h4 className="text-sm font-bold text-[#303653]">No items listed yet on this campus</h4>
            <p className="text-xs text-[#85899B] max-w-md mx-auto">
              Be the first to list a textbook, calculator, lab coat, or camera for your classmates at {collegeName}.
            </p>
            <button
              onClick={() => navigate('/listings/create')}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: '#7563D9' }}
            >
              + List an item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {popularItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className="p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between hover:shadow-card-hover"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
              >
                {/* Image */}
                <div className="h-36 rounded-xl overflow-hidden relative border border-[#EAE6E1] flex items-center justify-center bg-[#FFF8ED]">
                  {item.primary_image_url ? (
                    <img
                      src={item.primary_image_url}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-[#85899B]" />
                  )}
                  <span
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold border pointer-events-none"
                    style={{ backgroundColor: '#FFFCF7', color: '#7563D9', borderColor: '#EAE6E1' }}
                  >
                    {item.category_name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(item);
                    }}
                    aria-label={item.is_wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    title={item.is_wishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
                    className="absolute top-2 right-2 p-1.5 rounded-full transition-transform active:scale-80 hover:scale-110 duration-150 shadow-md cursor-pointer z-10"
                    style={{
                      backgroundColor: item.is_wishlisted ? '#FFE5D6' : 'rgba(255, 255, 255, 0.95)',
                      color: item.is_wishlisted ? '#F28B82' : '#85899B',
                      border: item.is_wishlisted ? '1px solid #F5CDB8' : '1px solid rgba(234, 230, 225, 0.9)',
                    }}
                  >
                    <Heart className={`w-3.5 h-3.5 transition-colors ${item.is_wishlisted ? 'fill-[#F28B82] text-[#F28B82]' : ''}`} />
                  </button>
                </div>

                {/* Details */}
                <div className="mt-3">
                  <h4 className="text-xs font-bold text-[#303653] line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-[#85899B] mt-0.5">By {item.owner?.display_name || 'Student'}</p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#EAE6E1]">
                    <div>
                      <span className="text-xs font-black text-[#7563D9]">₹{item.daily_rental_price}</span>
                      <span className="text-[10px] text-[#85899B]"> /day</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#42A879]">
                      Zero Deposit (₹0)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItemId && (
        <ItemDetailModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  );
};
