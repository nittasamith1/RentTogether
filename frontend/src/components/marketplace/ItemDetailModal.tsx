import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Star,
  MapPin,
  ShieldCheck,
  Heart,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { marketplaceService, ItemSummary } from '../../services/marketplace';
import { useWishlist } from '../../hooks/useWishlist';

interface ItemDetailModalProps {
  itemId: string;
  onClose: () => void;
  onSelectRelated?: (item: ItemSummary) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  itemId,
  onClose,
  onSelectRelated,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { toggleWishlist, isLoading: isWishlistLoading } = useWishlist();

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['item-detail', itemId],
    queryFn: () => marketplaceService.getItemDetail(itemId),
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-neutral-600">Loading resource details...</p>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full flex flex-col items-center text-center gap-3">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <h3 className="text-base font-bold text-neutral-900">Resource Unavailable</h3>
          <p className="text-xs text-neutral-600">
            This item could not be loaded or is not accessible within your campus.
          </p>
          <button
            onClick={onClose}
            className="mt-2 px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const galleryImages =
    item.images && item.images.length > 0
      ? item.images.map((img) => img.image_url)
      : [item.primary_image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'];

  const currentDisplayImage = galleryImages[activeImageIndex] || galleryImages[0];

  const conditionLabels: Record<string, { label: string; color: string }> = {
    BRAND_NEW: { label: 'Brand New', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    LIKE_NEW: { label: 'Like New', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    GOOD: { label: 'Good', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    FAIR: { label: 'Fair', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  };

  const conditionInfo = conditionLabels[item.condition] || {
    label: item.condition,
    color: 'bg-neutral-100 text-neutral-800 border-neutral-300',
  };

  const isAvailable = item.availability_status === 'AVAILABLE';

  // Savings calculation vs original retail price
  const retailPrice = item.original_purchase_price ? parseFloat(String(item.original_purchase_price)) : null;
  const rentalPrice = parseFloat(String(item.daily_rental_price));
  const estimatedSavings = retailPrice ? Math.max(0, retailPrice - rentalPrice * 3) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200/80 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
              {item.category_name}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${conditionInfo.color}`}>
              {conditionInfo.label}
            </span>
            {isAvailable ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Available on Campus
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Currently Borrowed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleWishlist(item.id, item.is_wishlisted)}
              disabled={isWishlistLoading}
              className={`p-2 rounded-full border transition ${
                item.is_wishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:text-rose-500'
              }`}
              title={item.is_wishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-4 h-4 ${item.is_wishlisted ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 transition"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Photos Gallery (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 relative">
              <img
                src={currentDisplayImage}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {/* Thumbnail list if multiple */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                      activeImageIndex === idx ? 'border-amber-500 shadow-xs' : 'border-neutral-200 opacity-70'
                    }`}
                  >
                    <img src={src} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Price & Deposit Summary Card */}
            <div className="bg-amber-500/5 border border-amber-200/80 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-neutral-900">₹{rentalPrice}</span>
                  <span className="text-xs text-neutral-600 font-medium"> / day</span>
                </div>
                {parseFloat(String(item.security_deposit)) > 0 && (
                  <div className="text-right">
                    <span className="text-xs text-neutral-500 block">Refundable Escrow Deposit</span>
                    <span className="text-sm font-bold text-neutral-800">
                      ₹{parseFloat(String(item.security_deposit))}
                    </span>
                  </div>
                )}
              </div>

              {retailPrice && estimatedSavings && estimatedSavings > 0 && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 border border-emerald-200 mt-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>
                    Save approx <strong>₹{estimatedSavings.toFixed(0)}</strong> compared to purchasing new (₹
                    {retailPrice})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Information & Specs (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 leading-snug">{item.title}</h2>
                {item.brand && (
                  <p className="text-xs text-neutral-500 font-medium mt-1">
                    Brand: <strong className="text-neutral-700">{item.brand}</strong>{' '}
                    {item.model_name ? `• Model: ${item.model_name}` : ''}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                  Resource Description
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {/* Rental Rules & Constraints */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-3">
                  <span className="text-[11px] font-semibold text-neutral-500 block mb-0.5">
                    Rental Duration
                  </span>
                  <p className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    {item.min_rental_days} to {item.max_rental_days} days
                  </p>
                </div>

                <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-3">
                  <span className="text-[11px] font-semibold text-neutral-500 block mb-0.5">
                    Campus Trust Level
                  </span>
                  <p className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Student Peer
                  </p>
                </div>
              </div>

              {/* Campus Pickup Spots */}
              {item.pickup_locations && item.pickup_locations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    Campus Handover Locations
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {item.pickup_locations.map((spot, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/70"
                      >
                        {spot}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Profile Card */}
              <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {item.owner.display_name ? item.owner.display_name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-neutral-900">{item.owner.display_name}</h4>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        {item.owner.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      {item.owner.department ? `${item.owner.department} • ` : ''}Year {item.owner.year_of_study}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-bold text-neutral-900">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{item.owner.reputation.toFixed(2)}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">{item.owner.review_count} peer reviews</span>
                </div>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="pt-2">
              {item.is_own_item ? (
                <div className="w-full py-3 px-4 rounded-2xl bg-neutral-100 text-neutral-600 text-xs font-semibold text-center border border-neutral-200">
                  This is your listed resource. You can manage or edit it from your Owner dashboard.
                </div>
              ) : isAvailable ? (
                <button
                  type="button"
                  onClick={() => {
                    alert(
                      `Booking request initiated for "${item.title}". Handover scheduled at ${item.pickup_locations[0] || 'Campus Center'}.`
                    );
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Request Rental for ₹{rentalPrice} / day
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 px-6 rounded-2xl bg-neutral-200 text-neutral-500 font-bold text-sm cursor-not-allowed"
                >
                  Currently Borrowed by Another Student
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related Items Section */}
        {item.related_items && item.related_items.length > 0 && (
          <div className="px-6 py-5 bg-neutral-50 border-t border-neutral-100 rounded-b-3xl">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-3">
              Other {item.category_name} items on campus
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {item.related_items.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    if (onSelectRelated) onSelectRelated(rel);
                  }}
                  className="bg-white rounded-xl p-2.5 border border-neutral-200/80 hover:border-amber-400 cursor-pointer transition shadow-2xs group"
                >
                  <div className="aspect-16/10 rounded-lg overflow-hidden bg-neutral-100 mb-2">
                    <img
                      src={rel.primary_image_url}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <h5 className="text-[11px] font-semibold text-neutral-900 line-clamp-1 group-hover:text-amber-600">
                    {rel.title}
                  </h5>
                  <p className="text-[11px] font-bold text-neutral-800 mt-0.5">
                    ₹{parseFloat(String(rel.daily_rental_price))} <span className="text-[9px] font-normal text-neutral-500">/day</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
