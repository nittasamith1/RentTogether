import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  Laptop,
  FlaskConical,
  Wrench,
  Package,
  Camera,
  Dumbbell,
  Grid2X2,
  ArrowUpDown,
  Building2,
} from 'lucide-react';
import { marketplaceService, MarketplaceFilterParams } from '../services/marketplace';
import { ItemCard } from '../components/marketplace/ItemCard';
import { PopularResources } from '../components/marketplace/PopularResources';
import { MarketplaceFilterSidebar } from '../components/marketplace/MarketplaceFilterSidebar';
import { ItemDetailModal } from '../components/marketplace/ItemDetailModal';

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state from URL query parameters
  const filters: MarketplaceFilterParams = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      condition: searchParams.get('condition') || '',
      start_date: searchParams.get('start_date') || '',
      end_date: searchParams.get('end_date') || '',
      availability: searchParams.get('availability') || '',
      pickup_spot: searchParams.get('pickup_spot') || '',
      min_rating: searchParams.get('min_rating') || '',
      sort: searchParams.get('sort') || 'newest',
      page: parseInt(searchParams.get('page') || '1', 10),
    };
  }, [searchParams]);

  // Update URL search parameters whenever a filter changes
  const updateFilters = (newValues: Partial<MarketplaceFilterParams>) => {
    const updated = { ...filters, ...newValues };
    const params = new URLSearchParams();

    Object.entries(updated).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.set(k, String(v));
      }
    });

    setSearchParams(params, { replace: true });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: marketplaceService.getCategories,
    staleTime: 1000 * 60 * 5,
  });

  const { data: popularItems = [] } = useQuery({
    queryKey: ['marketplace-popular'],
    queryFn: marketplaceService.getPopularItems,
    staleTime: 1000 * 60 * 3,
  });

  const {
    data: itemsData,
    isLoading: isItemsLoading,
  } = useQuery({
    queryKey: ['marketplace-items', filters],
    queryFn: () => marketplaceService.getItems(filters),
    staleTime: 1000 * 60 * 1,
  });

  const items = itemsData?.results || [];
  const totalCount = itemsData?.count || 0;
  const currentPage = filters.page || 1;
  const pageSize = 12;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Collect unique pickup spots across items
  const pickupSpots = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.pickup_locations) {
        item.pickup_locations.forEach((l) => set.add(l));
      }
    });
    return Array.from(set);
  }, [items]);

  // Category Icon resolver
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-4 h-4" />;
      case 'Laptop':
        return <Laptop className="w-4 h-4" />;
      case 'FlaskConical':
        return <FlaskConical className="w-4 h-4" />;
      case 'Wrench':
        return <Wrench className="w-4 h-4" />;
      case 'Package':
        return <Package className="w-4 h-4" />;
      case 'Camera':
        return <Camera className="w-4 h-4" />;
      case 'Dumbbell':
        return <Dumbbell className="w-4 h-4" />;
      default:
        return <Grid2X2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen pb-16 pt-2" style={{ backgroundColor: '#FFF8ED' }}>
      {/* 1. Campus Hero Header */}
      <section
        className="rounded-3xl border p-6 sm:p-8 mb-6 shadow-sm"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
              style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Aditya University Campus Catalog</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7563D9' }} />
              <span>Intra-Campus Trusted Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#303653' }}>
              Intra-Campus Resource Marketplace
            </h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#85899B' }}>
              Borrow laboratory kits, scientific calculators, high-end cameras, project tools, and
              academic equipment directly from verified peer students. Zero courier delays, safe
              on-campus handovers.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div
              className="rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] border shadow-xs"
              style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
            >
              <span className="text-xl font-black" style={{ color: '#303653' }}>{totalCount}</span>
              <span className="text-[11px] font-semibold" style={{ color: '#7563D9' }}>Active Listings</span>
            </div>
            <div
              className="rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] border shadow-xs"
              style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
            >
              <span className="text-xl font-black" style={{ color: '#6398D6' }}>8</span>
              <span className="text-[11px] font-semibold" style={{ color: '#3A6BB5' }}>Categories</span>
            </div>
            <div
              className="rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] border shadow-xs"
              style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
            >
              <span className="text-xl font-black" style={{ color: '#42A879' }}>100%</span>
              <span className="text-[11px] font-semibold" style={{ color: '#2D7A5B' }}>Verified Peers</span>
            </div>
          </div>
        </div>
      </section>

      <div>
        {/* 2. Popular / Trending Resources Carousel */}
        {popularItems.length > 0 && (
          <PopularResources
            items={popularItems}
            onSelect={(item) => setSelectedItemId(item.id)}
          />
        )}

        {/* 3. Horizontal Multi-Category Navigation Strip */}
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => updateFilters({ category: '', page: 1 })}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                !filters.category ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: !filters.category ? '#7563D9' : '#FFFCF7',
                color: !filters.category ? '#ffffff' : '#303653',
                borderColor: !filters.category ? '#7563D9' : '#EAE6E1',
              }}
            >
              <Grid2X2 className="w-4 h-4" />
              <span>All Categories</span>
            </button>

            {categories.map((cat) => {
              const isSelected = filters.category === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateFilters({ category: isSelected ? '' : cat.slug, page: 1 })}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                    isSelected ? 'shadow-sm' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected ? '#7563D9' : '#FFFCF7',
                    color: isSelected ? '#ffffff' : '#303653',
                    borderColor: isSelected ? '#7563D9' : '#EAE6E1',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#E9E3FF';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFCF7';
                  }}
                >
                  {getCategoryIcon(cat.icon_name)}
                  <span>{cat.name}</span>
                  {cat.eligible_item_count > 0 && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#E9E3FF',
                        color: isSelected ? '#ffffff' : '#7563D9',
                      }}
                    >
                      {cat.eligible_item_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Controls Bar (Active Filters, Sort dropdown, Mobile filter button) */}
        <div
          className="rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4 border"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border"
              style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <span className="text-xs font-semibold" style={{ color: '#85899B' }}>
              Showing <strong style={{ color: '#303653' }}>{items.length}</strong> of{' '}
              <strong style={{ color: '#303653' }}>{totalCount}</strong> resources
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#85899B' }}>
              <ArrowUpDown className="w-3.5 h-3.5" style={{ color: '#85899B' }} />
              Sort By:
            </span>
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => updateFilters({ sort: e.target.value, page: 1 })}
              className="px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#7563D9] border"
              style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="owner_rating">Highest Owner Rating</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* 5. Main Content Grid (Sidebar + Items Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar (3 cols) */}
          <div className="hidden lg:block lg:col-span-3">
            <MarketplaceFilterSidebar
              categories={categories}
              filters={filters}
              onFilterChange={updateFilters}
              onReset={handleResetFilters}
              pickupSpots={pickupSpots}
            />
          </div>

          {/* Mobile Filter Drawer Overlay */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <div
                className="relative ml-auto w-full max-w-xs h-full p-5 overflow-y-auto shadow-2xl z-10 flex flex-col gap-4 border-l"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
              >
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #EAE6E1' }}>
                  <h3 className="font-bold text-sm" style={{ color: '#303653' }}>Filters</h3>
                  <button onClick={() => setIsMobileFilterOpen(false)}>
                    <X className="w-5 h-5" style={{ color: '#85899B' }} />
                  </button>
                </div>
                <MarketplaceFilterSidebar
                  categories={categories}
                  filters={filters}
                  onFilterChange={(newF) => {
                    updateFilters(newF);
                  }}
                  onReset={handleResetFilters}
                  pickupSpots={pickupSpots}
                />
              </div>
            </div>
          )}

          {/* Product Cards Grid (9 cols) */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {isItemsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border p-4 flex flex-col gap-3 animate-pulse"
                    style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
                  >
                    <div className="aspect-4/3 rounded-xl" style={{ backgroundColor: '#E9E3FF' }} />
                    <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#EAE6E1' }} />
                    <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#EAE6E1' }} />
                    <div className="h-8 rounded mt-4" style={{ backgroundColor: '#E9E3FF' }} />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div
                className="rounded-3xl border p-12 text-center flex flex-col items-center justify-center gap-4"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
              >
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center"
                  style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
                >
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold" style={{ color: '#303653' }}>No matching campus resources found</h3>
                <p className="text-xs max-w-sm" style={{ color: '#85899B' }}>
                  We couldn't find any resources matching your search and filter criteria. Try adjusting
                  the price range or clearing some filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  style={{ backgroundColor: '#7563D9' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onSelect={(selected) => setSelectedItemId(selected.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                className="rounded-2xl border p-4 flex items-center justify-between"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
              >
                <button
                  disabled={currentPage <= 1}
                  onClick={() => updateFilters({ page: currentPage - 1 })}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                  style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                >
                  &larr; Previous
                </button>

                <span className="text-xs font-medium" style={{ color: '#85899B' }}>
                  Page <strong style={{ color: '#303653' }}>{currentPage}</strong> of{' '}
                  <strong style={{ color: '#303653' }}>{totalPages}</strong>
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => updateFilters({ page: currentPage + 1 })}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                  style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Item Detail Inspection Modal */}
      {selectedItemId && (
        <ItemDetailModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
          onSelectRelated={(relatedItem) => setSelectedItemId(relatedItem.id)}
        />
      )}
    </div>
  );
};
