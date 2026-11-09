import React from 'react';
import { Heart, Star, MapPin, Clock } from 'lucide-react';
import { ItemSummary } from '../../services/marketplace';
import { useWishlist } from '../../hooks/useWishlist';

interface ItemCardProps {
  item: ItemSummary;
  onSelect: (item: ItemSummary) => void;
}

export const ItemCard = React.memo<ItemCardProps>(({ item, onSelect }) => {
  const { toggleWishlist } = useWishlist();

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(item);
  };

  const conditionColors: Record<string, { bg: string; text: string; label: string; border: string }> = {
    BRAND_NEW: { bg: '#DDF3E7', text: '#42A879', border: '#B8E5CC', label: 'Brand New' },
    LIKE_NEW: { bg: '#DFEDFF', text: '#3A6BB5', border: '#C5DCFA', label: 'Like New' },
    GOOD: { bg: '#E9E3FF', text: '#7563D9', border: '#D8D0F5', label: 'Good' },
    FAIR: { bg: '#FFE5D6', text: '#C45C20', border: '#F5CDB8', label: 'Fair' },
  };

  const cond = conditionColors[item.condition] || {
    bg: '#FFF8ED',
    text: '#85899B',
    border: '#EAE6E1',
    label: item.condition,
  };

  const isAvailable = item.availability_status === 'AVAILABLE';
  const dailyPrice = parseFloat(String(item.daily_rental_price)) || 0;
  const hourlyPrice = Math.round((dailyPrice / 24) * 100) / 100;

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative rounded-2xl border shadow-xs hover:shadow-card-hover transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D8D0F5')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#EAE6E1')}
    >
      {/* Top Image & Overlays */}
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
          <div className="w-full h-full flex items-center justify-center text-xs font-semibold" style={{ color: '#85899B', backgroundColor: '#E9E3FF' }}>
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

        {/* Wishlist Heart Button with instant optimistic toggle & micro-animation */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={item.is_wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          title={item.is_wishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
          className="absolute top-3 right-3 p-2 rounded-full transition-transform active:scale-80 hover:scale-110 duration-150 shadow-md cursor-pointer z-10"
          style={{
            backgroundColor: item.is_wishlisted ? '#FFE5D6' : 'rgba(255, 255, 255, 0.95)',
            color: item.is_wishlisted ? '#F28B82' : '#85899B',
            border: item.is_wishlisted ? '1px solid #F5CDB8' : '1px solid rgba(234, 230, 225, 0.9)',
          }}
        >
          <Heart className={`w-4 h-4 transition-colors ${item.is_wishlisted ? 'fill-[#F28B82] text-[#F28B82]' : ''}`} />
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

      {/* Item Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Brand */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-bold line-clamp-1 transition-colors group-hover:text-[#7563D9]"
              style={{ color: '#303653' }}
            >
              {item.title}
            </h3>
          </div>
          {item.brand && (
            <p className="text-xs font-medium mt-0.5" style={{ color: '#85899B' }}>
              {item.brand} {item.model_name ? `• ${item.model_name}` : ''}
            </p>
          )}

          {/* Short Description */}
          <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: '#85899B' }}>
            {item.short_description}
          </p>
        </div>

        <div className="mt-4 pt-3 flex flex-col gap-2.5" style={{ borderTop: '1px solid #EAE6E1' }}>
          {/* Pricing & Deposit */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg font-black" style={{ color: '#303653' }}>
                ₹{dailyPrice}
              </span>
              <span className="text-xs font-normal" style={{ color: '#85899B' }}>/day</span>
              <span className="text-xs font-semibold" style={{ color: '#85899B' }}>•</span>
              <span className="text-xs font-bold" style={{ color: '#7563D9' }}>
                ₹{hourlyPrice.toFixed(0)}/hr
              </span>
            </div>
            {parseFloat(String(item.security_deposit)) > 0 && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-md font-medium border"
                style={{ backgroundColor: '#FFF8ED', color: '#85899B', borderColor: '#EAE6E1' }}
              >
                ₹{parseFloat(String(item.security_deposit))} deposit
              </span>
            )}
          </div>

          {/* Owner info & Pickup */}
          <div className="flex items-center justify-between text-xs pt-1" style={{ color: '#85899B' }}>
            <div className="flex items-center gap-1.5 truncate max-w-[65%]">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
              >
                {item.owner.display_name ? item.owner.display_name.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="truncate font-medium" style={{ color: '#303653' }}>{item.owner.display_name}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 font-semibold shrink-0" style={{ color: '#303653' }}>
              <Star className="w-3.5 h-3.5 fill-[#E8A447]" style={{ color: '#E8A447' }} />
              <span>{item.owner.reputation.toFixed(1)}</span>
            </div>
          </div>

          {/* Pickup spot indicator */}
          {item.pickup_locations && item.pickup_locations.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] truncate" style={{ color: '#85899B' }}>
              <MapPin className="w-3 h-3 shrink-0" style={{ color: '#7563D9' }} />
              <span className="truncate">{item.pickup_locations[0]}</span>
              {item.pickup_locations.length > 1 && (
                <span className="shrink-0" style={{ color: '#85899B' }}>+{item.pickup_locations.length - 1}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
