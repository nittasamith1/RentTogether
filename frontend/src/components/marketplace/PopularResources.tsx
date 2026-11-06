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
  const { toggleWishlist, isLoading } = useWishlist();

  if (!items || items.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/70 rounded-3xl p-5 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-1.5">
              Campus Favorites & Trending
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Top Rated
              </span>
            </h2>
            <p className="text-xs text-neutral-600">
              Most requested resources and peer recommendations on campus this week
            </p>
          </div>
        </div>

        {/* Carousel arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleScroll('left')}
            className="p-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs"
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
            className="shrink-0 w-64 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer snap-start flex flex-col justify-between group"
          >
            <div className="relative aspect-16/10 w-full bg-neutral-100 overflow-hidden">
              <img
                src={item.primary_image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900/80 text-white backdrop-blur-md">
                {item.category_name}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading) {
                    toggleWishlist(item.id, item.is_wishlisted);
                  }
                }}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition ${
                  item.is_wishlisted
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/80 text-neutral-600 hover:bg-white hover:text-rose-500'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${item.is_wishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-neutral-500 font-medium">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{item.owner.reputation.toFixed(1)}</span>
                  <span>•</span>
                  <span className="truncate">{item.owner.display_name}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-neutral-900">
                    ₹{parseFloat(String(item.daily_rental_price))}
                  </span>
                  <span className="text-[10px] text-neutral-500"> / day</span>
                </div>
                <span className="text-[11px] text-amber-600 font-semibold group-hover:translate-x-0.5 transition-transform">
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
