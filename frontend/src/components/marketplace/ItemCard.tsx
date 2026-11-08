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
      setIsWishlisted(!nextState);
    }
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
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs"
            style={{ backgroundColor: cond.bg, color: cond.text, borderColor: cond.border }}
          >
            {cond.label}
          </span>
          {isAvailable ? (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white backdrop-blur-md shadow-xs flex items-center gap-1"
              style={{ backgroundColor: '#42A879' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Available
            </span>
          ) : (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white backdrop-blur-md shadow-xs flex items-center gap-1"
              style={{ backgroundColor: 'rgba(48, 54, 83, 0.8)' }}
            >
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
          className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-xs cursor-pointer"
          style={{
            backgroundColor: isWishlisted ? '#F28B82' : 'rgba(255, 255, 255, 0.85)',
            color: isWishlisted ? '#fff' : '#85899B',
          }}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Category Pill */}
        <div className="absolute bottom-2.5 left-3">
          <span
            className="px-2.5 py-1 rounded-md text-xs font-semibold text-white backdrop-blur-md flex items-center gap-1 shadow-xs"
            style={{ backgroundColor: 'rgba(48, 54, 83, 0.85)' }}
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
            <div>
              <span className="text-lg font-black" style={{ color: '#303653' }}>
                ₹{parseFloat(String(item.daily_rental_price))}
              </span>
              <span className="text-xs font-normal" style={{ color: '#85899B' }}> / day</span>
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
};
