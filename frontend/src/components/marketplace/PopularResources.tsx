import React, { useRef } from 'react';
import { Flame, ChevronLeft, ChevronRight, Star, Heart } from 'lucide-react';
import { ItemSummary } from '../../services/marketplace';
import { useWishlist } from '../../hooks/useWishlist';

interface PopularResourcesProps {
  items: ItemSummary[];
  onSelect: (item: ItemSummary) => void;
}

export const PopularResources: React.FC<PopularResourcesProps> = ({ items, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toggleWishlist } = useWishlist();

  if (!items || items.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="rounded-3xl p-5 mb-8 border"
      style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-xl text-white shadow-xs"
            style={{ backgroundColor: '#7563D9' }}
          >
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-1.5" style={{ color: '#303653' }}>
              Campus Favorites & Trending
              <span
                className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
              >
                Top Rated
              </span>
            </h2>
            <p className="text-xs" style={{ color: '#85899B' }}>
              Most requested resources and peer recommendations on campus this week
            </p>
          </div>
        </div>

        {/* Carousel arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleScroll('left')}
            className="p-2 rounded-full border transition shadow-2xs cursor-pointer"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-2 rounded-full border transition shadow-2xs cursor-pointer"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="shrink-0 w-64 rounded-2xl border shadow-2xs hover:shadow-card-hover transition-all duration-200 overflow-hidden cursor-pointer snap-start flex flex-col justify-between group"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div className="relative aspect-16/10 w-full overflow-hidden" style={{ backgroundColor: '#E9E3FF' }}>
              <img
                src={item.primary_image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <span
                className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: 'rgba(48, 54, 83, 0.90)' }}
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

            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <h4
                  className="text-xs font-bold line-clamp-1 transition-colors group-hover:text-[#7563D9]"
                  style={{ color: '#303653' }}
                >
                  {item.title}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-medium" style={{ color: '#85899B' }}>
                  <Star className="w-3 h-3 fill-[#E8A447]" style={{ color: '#E8A447' }} />
                  <span style={{ color: '#303653' }}>{item.owner.reputation.toFixed(1)}</span>
                  <span>•</span>
                  <span className="truncate">{item.owner.display_name}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid #EAE6E1' }}>
                <div>
                  <span className="text-sm font-bold" style={{ color: '#303653' }}>
                    ₹{parseFloat(String(item.daily_rental_price))}
                  </span>
                  <span className="text-[10px]" style={{ color: '#85899B' }}> / day</span>
                </div>
                <span className="text-[11px] font-bold group-hover:translate-x-0.5 transition-transform" style={{ color: '#7563D9' }}>
                  Rent &rarr;
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
