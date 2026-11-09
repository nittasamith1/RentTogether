import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Clock,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';
import { ItemDetailModal } from '../components/marketplace/ItemDetailModal';
import { ItemCardSkeleton } from '../components/common/Skeleton';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  const { useWishlistItems, toggleWishlist, clearWishlist, isClearing } = useWishlist();
  const { data, isLoading, isError, refetch } = useWishlistItems(page);

  const items = data?.results || [];
  const totalCount = data?.count || 0;

  const conditionColors: Record<string, { bg: string; text: string; label: string; border: string }> = {
    BRAND_NEW: { bg: '#DDF3E7', text: '#42A879', border: '#B8E5CC', label: 'Brand New' },
    LIKE_NEW: { bg: '#DFEDFF', text: '#3A6BB5', border: '#C5DCFA', label: 'Like New' },
    GOOD: { bg: '#E9E3FF', text: '#7563D9', border: '#D8D0F5', label: 'Good' },
    FAIR: { bg: '#FFE5D6', text: '#C45C20', border: '#F5CDB8', label: 'Fair' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none pt-4">
      {/* Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3"
        style={{ borderBottom: '1px solid #EAE6E1' }}
      >
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 border"
            style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8', color: '#F28B82' }}
          >
            <Heart className="w-3.5 h-3.5 fill-[#F28B82]" />
            <span>My Saved Campus Gear</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: '#303653' }}>
            Saved Wishlist
          </h1>
          <p className="text-xs mt-1" style={{ color: '#85899B' }}>
            All your favorited academic tools, gear, and supplies saved for upcoming coursework, fests, or lab sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <div
            className="px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
          >
            <span style={{ color: '#85899B' }}>Saved Items:</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-extrabold text-white"
              style={{ backgroundColor: '#F28B82' }}
            >
              {totalCount}
            </span>
          </div>

          {totalCount > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear your entire wishlist history? This will permanently remove all saved items from the database to reclaim storage.')) {
                  clearWishlist();
                }
              }}
              disabled={isClearing}
              className="px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:bg-[#FFF0F0] hover:text-[#E87575] hover:border-[#F28B82] active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#85899B' }}
              title="Clear all saved items and free up database storage"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#E87575]" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={() => navigate('/marketplace')}
            className="px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer text-white"
            style={{ backgroundColor: '#7563D9' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
          >
            <span>Explore Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        /* Loading Skeleton Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <ItemCardSkeleton key={n} />
          ))}
        </div>
      ) : isError ? (
        /* Error State */
        <div
          className="p-8 rounded-3xl border text-center space-y-3"
          style={{ backgroundColor: '#FFF0F0', borderColor: '#F28B82' }}
        >
          <AlertCircle className="w-8 h-8 mx-auto" style={{ color: '#E87575' }} />
          <h3 className="text-sm font-bold text-[#303653]">Failed to load your wishlist</h3>
          <p className="text-xs text-[#85899B]">
            Could not retrieve saved items. Please verify your network and backend connection.
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2 text-white rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 mx-auto"
            style={{ backgroundColor: '#E87575' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div
          className="rounded-3xl p-10 sm:p-14 border shadow-sm text-center space-y-4 max-w-lg mx-auto my-8"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xs"
            style={{ backgroundColor: '#FFE5D6', color: '#F28B82' }}
          >
            <Heart className="w-8 h-8 stroke-[1.75]" />
          </div>

          <div>
            <h3 className="text-lg font-bold" style={{ color: '#303653' }}>
              Your Wishlist is Empty
            </h3>
            <p className="text-xs mt-1 max-w-sm mx-auto leading-relaxed" style={{ color: '#85899B' }}>
              Browse the campus marketplace and click the heart icon on any gear to save it here for later.
            </p>
          </div>

          <button
            onClick={() => navigate('/marketplace')}
            className="text-white px-6 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-95"
            style={{ backgroundColor: '#7563D9' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Campus Gear</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      ) : (
        /* Grid of Wishlist Items */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            const cond = conditionColors[item.condition] || {
              bg: '#FFF8ED',
              text: '#85899B',
              border: '#EAE6E1',
              label: item.condition,
            };
            const isAvailable = item.availability_status === 'AVAILABLE';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className="group relative rounded-2xl border shadow-xs hover:shadow-card-hover transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D8D0F5')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#EAE6E1')}
              >
                {/* Top Image & Overlays */}
                <div>
                  <div className="relative aspect-4/3 w-full overflow-hidden" style={{ backgroundColor: '#E9E3FF' }}>
                    {item.primary_image_url ? (
                      <img
                        src={item.primary_image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-xs font-semibold"
                        style={{ color: '#85899B', backgroundColor: '#E9E3FF' }}
                      >
                        <span>No photo available</span>
                      </div>
                    )}

                    {/* Condition Badge */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center pointer-events-none">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs"
                        style={{ backgroundColor: cond.bg, color: cond.text, borderColor: cond.border }}
                      >
                        {cond.label}
                      </span>
                      {isAvailable ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-xs flex items-center gap-1"
                          style={{ backgroundColor: '#42A879' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Available
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-xs flex items-center gap-1"
                          style={{ backgroundColor: '#303653' }}
                        >
                          <Clock className="w-3 h-3" />
                          Rented
                        </span>
                      )}
                    </div>

                    {/* Remove from Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(item, true); // remove from wishlist
                      }}
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                      className="absolute top-3 right-3 p-2 rounded-full transition-transform active:scale-80 hover:scale-110 duration-150 shadow-md cursor-pointer z-10"
                      style={{
                        backgroundColor: '#FFE5D6',
                        color: '#F28B82',
                        border: '1px solid #F5CDB8',
                      }}
                    >
                      <Heart className="w-4 h-4 fill-[#F28B82] text-[#F28B82] transition-colors" />
                    </button>

                    {/* Category Pill */}
                    <div className="absolute bottom-2.5 left-3 pointer-events-none">
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-semibold text-white flex items-center gap-1 shadow-xs"
                        style={{ backgroundColor: 'rgba(48, 54, 83, 0.90)' }}
                      >
                        {item.category_name}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    <h3
                      className="font-bold line-clamp-1 transition-colors group-hover:text-[#7563D9] text-sm"
                      style={{ color: '#303653' }}
                    >
                      {item.title}
                    </h3>

                    {item.short_description && (
                      <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: '#85899B' }}>
                        {item.short_description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Pricing & Action */}
                <div className="p-4 pt-0">
                  <div
                    className="pt-2.5 flex items-center justify-between"
                    style={{ borderTop: '1px solid #EAE6E1' }}
                  >
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold" style={{ color: '#7563D9' }}>
                          ₹{item.daily_rental_price}
                        </span>
                        <span className="text-xs" style={{ color: '#85899B' }}>
                          / day
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#42A879] block">
                        Zero Deposit (₹0)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemId(item.id);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      style={{ backgroundColor: '#7563D9' }}
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > 12 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-40 cursor-pointer"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
          >
            Previous
          </button>
          <span className="text-xs font-semibold" style={{ color: '#85899B' }}>
            Page {page} of {Math.ceil(totalCount / 12)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(totalCount / 12)}
            className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-40 cursor-pointer"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
          >
            Next
          </button>
        </div>
      )}

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
