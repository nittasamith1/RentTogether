import React, { useState } from 'react';
import { Heart, Star, MapPin, Clock } from 'lucide-react';
import { ItemSummary } from '../../services/marketplace';
import { useWishlist } from '../../hooks/useWishlist';

interface ItemCardProps {
  item: ItemSummary;
  onSelect: (item: ItemSummary) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
  const { toggleWishlist, isLoading } = useWishlist();
  const [isWishlisted, setIsWishlisted] = useState(item.is_wishlisted);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    try {
      await toggleWishlist(item.id, isWishlisted);
    } catch {
      setIsWishlisted(!nextState); // rollback on error
    }
  };

  const conditionColors: Record<string, { bg: string; text: string; label: string }> = {
    BRAND_NEW: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Brand New' },
    LIKE_NEW: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Like New' },
    GOOD: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'Good' },
    FAIR: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Fair' },
  };

  const cond = conditionColors[item.condition] || {
    bg: 'bg-neutral-100 border-neutral-200',
    text: 'text-neutral-700',
    label: item.condition,
  };

  const isAvailable = item.availability_status === 'AVAILABLE';

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative bg-white rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-md hover:border-neutral-300 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Top Image & Overlays */}
      <div className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden">
        {item.primary_image_url ? (
          <img
            src={item.primary_image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 bg-neutral-100">
            <span className="text-sm font-medium">No photo available</span>
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs ${cond.bg} ${cond.text}`}
          >
            {cond.label}
          </span>
          {isAvailable ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/90 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Available
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-700/80 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Rented
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-xs ${
            isWishlisted
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-white/80 text-neutral-600 hover:bg-white hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Category Pill */}
        <div className="absolute bottom-2.5 left-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-900/75 text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
            {item.category_name}
          </span>
        </div>
      </div>

      {/* Item Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Brand */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-neutral-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
              {item.title}
            </h3>
          </div>
          {item.brand && (
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              {item.brand} {item.model_name ? `• ${item.model_name}` : ''}
            </p>
          )}

          {/* Short Description */}
          <p className="text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
            {item.short_description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col gap-2.5">
          {/* Pricing & Deposit */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-lg font-bold text-neutral-900">₹{parseFloat(String(item.daily_rental_price))}</span>
              <span className="text-xs text-neutral-500 font-normal"> / day</span>
            </div>
            {parseFloat(String(item.security_deposit)) > 0 && (
              <span className="text-[11px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md font-medium">
                ₹{parseFloat(String(item.security_deposit))} deposit
              </span>
            )}
          </div>

          {/* Owner info & Pickup */}
          <div className="flex items-center justify-between text-xs text-neutral-600 pt-1">
            <div className="flex items-center gap-1.5 truncate max-w-[65%]">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                {item.owner.display_name ? item.owner.display_name.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="truncate font-medium text-neutral-800">{item.owner.display_name}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 font-semibold text-neutral-800 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{item.owner.reputation.toFixed(1)}</span>
            </div>
          </div>

          {/* Pickup spot indicator */}
          {item.pickup_locations && item.pickup_locations.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-neutral-500 truncate">
              <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
              <span className="truncate">{item.pickup_locations[0]}</span>
              {item.pickup_locations.length > 1 && (
                <span className="text-neutral-400 shrink-0">+{item.pickup_locations.length - 1}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
