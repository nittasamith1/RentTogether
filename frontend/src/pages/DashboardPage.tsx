import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Package,
  Plus,
  Flame,
  ShieldCheck,
  Heart,
  Leaf,
  GraduationCap,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMyRentals, useMyIncomingRequests } from '../hooks/useBookings';
import { useProfile } from '../hooks/useProfile';
import { useWishlist } from '../hooks/useWishlist';
import { useMyImpact } from '../hooks/useSustainability';
import { usePersonalizedRecommendations } from '../hooks/useRecommendations';
import { SustainabilityImpactWidget } from '../components/sustainability/SustainabilityImpactWidget';
import { marketplaceService, ItemSummary } from '../services/marketplace';
import { ItemDetailModal } from '../components/marketplace/ItemDetailModal';
import { ItemCardSkeleton } from '../components/common/Skeleton';
import { getMediaUrl } from '../utils/media';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleWishlist } = useWishlist();
  const displayName = user?.first_name || user?.name?.split(' ')[0] || 'Student';
  // 1. Real Queries for Dashboard Data (Live database fetching)
  const { data: rentalsData } = useMyRentals();
  const { data: incomingData } = useMyIncomingRequests();
  const { data: profile } = useProfile();
  const { data: sustainabilityImpact, isLoading: loadingImpact } = useMyImpact();
  const { data: personalizedData, isLoading: loadingRecs } = usePersonalizedRecommendations(6);

  const collegeName = user?.college_name || profile?.college_name || 'Campus';

  const { data: popularItems = [], isLoading: loadingPopular } = useQuery<ItemSummary[]>({
    queryKey: ['popular-items-dashboard'],
    queryFn: () => marketplaceService.getPopularItems(),
    staleTime: 60000, // Cache for 60 seconds (snappy instant renders)
  });

  // State
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Calculations directly from database records
  const totalRentals = rentalsData?.count || 0;
  const activeRentalsCount =
    rentalsData?.results?.filter(
      (r) => r.status === 'ACTIVE' || r.status === 'PAID_CONFIRMED'
    ).length || 0;

  const savingsAmount = Math.round(Number(profile?.total_savings_inr || 0));

  // Dynamic KPI values fetched strictly from database
  const activeRentalsKpi = sustainabilityImpact?.active_rentals ?? activeRentalsCount;
  const completedRentalsKpi = sustainabilityImpact?.completed_rentals ?? totalRentals;
  const moneySavedKpi = Math.round(sustainabilityImpact?.money_saved_inr ?? savingsAmount);
  const wasteAvoidedKpi = sustainabilityImpact?.waste_avoided_kg ?? 0;

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

      {/* 2. Phase 14: Real-Time KPI Cards (Matching Mockup) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: [3] Active Rentals — Soft Lavender */}
        <div
          onClick={() => navigate('/rentals')}
          className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#7563D9' }}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7563D9]" />
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-[11px] sm:text-xs font-semibold" style={{ color: '#7563D9' }}>Active Rentals</div>
            <div className="text-xl sm:text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              {loadingImpact ? '...' : activeRentalsKpi}
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium mt-0.5 sm:mt-1 flex items-center gap-1 truncate" style={{ color: '#5B48B8' }}>
              <Package className="w-3 h-3 shrink-0" />
              <span className="truncate">Ongoing borrowed & lent</span>
            </div>
          </div>
        </div>

        {/* Card 2: [8] Completed Rentals — Sky Blue */}
        <div
          onClick={() => navigate('/rentals')}
          className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#6398D6' }}>
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6398D6]" />
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-[11px] sm:text-xs font-semibold" style={{ color: '#3A6BB5' }}>Completed Rentals</div>
            <div className="text-xl sm:text-2xl font-black mt-0.5" style={{ color: '#303653' }}>
              {loadingImpact ? '...' : completedRentalsKpi}
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium mt-0.5 sm:mt-1 flex items-center gap-1 truncate" style={{ color: '#3A6BB5' }}>
              <RefreshCw className="w-3 h-3 shrink-0" />
              <span className="truncate">Resources shared & returned</span>
            </div>
          </div>
        </div>

        {/* Card 3: [₹2,450] Money Saved — Soft Peach */}
        <div
          onClick={() => navigate('/analytics')}
          className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm text-white shrink-0" style={{ backgroundColor: '#C45C20' }}>
              ₹
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C45C20]" />
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-[11px] sm:text-xs font-semibold" style={{ color: '#C45C20' }}>Money Saved</div>
            <div className="text-xl sm:text-2xl font-black mt-0.5 truncate" style={{ color: '#303653' }}>
              ₹{loadingImpact ? '...' : moneySavedKpi.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium mt-0.5 sm:mt-1 truncate" style={{ color: '#C45C20' }}>
              Compared to retail purchases
            </div>
          </div>
        </div>

        {/* Card 4: Waste Avoided — Fresh Mint */}
        <div
          onClick={() => navigate('/analytics')}
          className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#42A879' }}>
              <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#42A879]" />
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-[11px] sm:text-xs font-semibold" style={{ color: '#2D7A5B' }}>Waste Avoided</div>
            <div className="text-xl sm:text-2xl font-black mt-0.5 truncate" style={{ color: '#303653' }}>
              {loadingImpact ? '...' : `${wasteAvoidedKpi} kg`}
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium mt-0.5 sm:mt-1 truncate" style={{ color: '#2D7A5B' }}>
              Embodied e-waste prevented
            </div>
          </div>
        </div>
      </div>

      {/* 2.5. Campus Sustainability Impact Widget (Phase 14) */}
      <SustainabilityImpactWidget impact={sustainabilityImpact} isLoading={loadingImpact} />

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
                Our ML pricing engine evaluates item age, condition, and purchase cost to recommend optimal daily rental rates with zero deposit across campus.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border bg-white" style={{ borderColor: '#EAE6E1' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: '#303653' }}>
                  Zero-Deposit Campus Protection
                </span>
                <span className="text-[10px] font-bold font-mono text-[#6398D6]">
                  100% Verified
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#85899B' }}>
                All equipment exchanges operate with ₹0 deposit. Dual QR handovers, ID verification, and inspection passes ensure peer accountability and dispute protection.
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

      {/* 3.5. AI Personalized Recommendations / Department Picks (Phase 13) */}
      {personalizedData?.recommendations && personalizedData.recommendations.length > 0 && (
        <div
          className="rounded-3xl p-6 border shadow-xs space-y-4"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
                style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
              >
                <Sparkles className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h2 className="text-sm sm:text-base font-bold shrink-0" style={{ color: '#303653' }}>
                    Recommended For You
                  </h2>
                  <span
                    className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border inline-flex items-center gap-1 max-w-full"
                    style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
                  >
                    <GraduationCap className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-none">
                      {personalizedData.department
                        ? `${personalizedData.department.toUpperCase()} Department Picks`
                        : 'Smart Campus Match'}
                    </span>
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
                  AI suggestions based on your department academic calendar and previous equipment usage.
                </p>
              </div>
            </div>

            <Link
              to="/marketplace"
              className="text-xs font-bold text-[#7563D9] flex items-center gap-1 hover:underline self-end sm:self-auto shrink-0"
            >
              <span>Explore all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingRecs ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
              {[1, 2, 3, 4].map((n) => (
                <ItemCardSkeleton key={n} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
              {personalizedData.recommendations.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className="p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between hover:shadow-card-hover"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#EAE6E1' }}
                >
                  <div className="h-24 sm:h-28 rounded-xl overflow-hidden relative border border-[#EAE6E1] flex items-center justify-center bg-[#FFF8ED]">
                    {item.primary_image_url ? (
                      <img
                        src={getMediaUrl(item.primary_image_url)}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-[#85899B]" />
                    )}
                    <span
                      className="absolute top-1.5 left-1.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold border pointer-events-none"
                      style={{ backgroundColor: '#FFFCF7', color: '#7563D9', borderColor: '#EAE6E1' }}
                    >
                      {item.category_name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist({
                          id: item.id,
                          owner_id: item.owner_id,
                          is_wishlisted: Boolean(item.is_wishlisted),
                        });
                      }}
                      aria-label={item.is_wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      title={item.is_wishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
                      className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1.5 rounded-full transition-transform active:scale-80 hover:scale-110 duration-150 shadow-md cursor-pointer z-10"
                      style={{
                        backgroundColor: item.is_wishlisted ? '#FFE5D6' : 'rgba(255, 255, 255, 0.95)',
                        color: item.is_wishlisted ? '#F28B82' : '#85899B',
                        border: item.is_wishlisted ? '1px solid #F5CDB8' : '1px solid rgba(234, 230, 225, 0.9)',
                      }}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors duration-150 ${
                          item.is_wishlisted ? 'fill-current text-[#F28B82]' : 'text-[#85899B]'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-1">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold tracking-tight line-clamp-1"
                      style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
                    >
                      {item.recommendation_reason || item.match_reason || 'Smart Match'}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#303653] line-clamp-1">{item.title}</h4>
                    <div className="flex items-center justify-between pt-1 border-t border-[#EAE6E1]">
                      <span className="text-xs sm:text-sm font-extrabold text-[#7563D9]">
                        ₹{item.rental_price_per_day}
                        <span className="text-[10px] text-[#85899B] font-normal">/day</span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-[#42A879]">₹0 Dep</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Real Popular / Trending Items on Campus */}
      <div
        className="rounded-3xl p-6 border shadow-xs space-y-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-white shadow-xs shrink-0" style={{ backgroundColor: '#7563D9' }}>
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
            className="text-xs font-bold text-[#7563D9] flex items-center gap-1 hover:underline self-end sm:self-auto shrink-0"
          >
            <span>Explore all items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingPopular ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
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
                      src={getMediaUrl(item.primary_image_url)}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                      }}
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
