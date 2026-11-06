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
    <div className="min-h-screen bg-[#FDFBF9] pb-16">
      {/* 1. Campus Hero Header */}
      <section className="bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-300/60 text-amber-900 text-xs font-semibold mb-3">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Aditya University Campus Catalog</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Intra-Campus Trusted Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Intra-Campus Resource Marketplace
            </h1>
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
              Borrow laboratory kits, scientific calculators, high-end cameras, project tools, and
              academic equipment directly from verified peer students. Zero courier delays, safe
              on-campus handovers.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-xl font-black text-neutral-900">{totalCount}</span>
              <span className="text-[11px] font-semibold text-neutral-500">Active Listings</span>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-xl font-black text-amber-600">8</span>
              <span className="text-[11px] font-semibold text-neutral-500">Categories</span>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-xl font-black text-emerald-600">100%</span>
              <span className="text-[11px] font-semibold text-neutral-500">Verified Peers</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
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
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
                !filters.category
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
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
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {getCategoryIcon(cat.icon_name)}
                  <span>{cat.name}</span>
                  {cat.eligible_item_count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                        isSelected ? 'bg-amber-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
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
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 mb-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-800"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span>Filters</span>
            </button>

            <span className="text-xs font-semibold text-neutral-600">
              Showing <strong className="text-neutral-900">{items.length}</strong> of{' '}
              <strong className="text-neutral-900">{totalCount}</strong> resources
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              Sort By:
            </span>
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => updateFilters({ sort: e.target.value, page: 1 })}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <div className="relative ml-auto w-full max-w-xs bg-white h-full p-5 overflow-y-auto shadow-2xl z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <h3 className="font-bold text-sm text-neutral-900">Filters</h3>
                  <button onClick={() => setIsMobileFilterOpen(false)}>
                    <X className="w-5 h-5 text-neutral-500" />
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
                    className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-col gap-3 animate-pulse"
                  >
                    <div className="aspect-4/3 rounded-xl bg-neutral-200" />
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                    <div className="h-8 bg-neutral-100 rounded mt-4" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">No matching campus resources found</h3>
                <p className="text-xs text-neutral-500 max-w-sm">
                  We couldn't find any resources matching your search and filter criteria. Try adjusting
                  the price range or clearing some filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition shadow-xs"
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
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 flex items-center justify-between">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => updateFilters({ page: currentPage - 1 })}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition"
                >
                  &larr; Previous
                </button>

                <span className="text-xs font-medium text-neutral-600">
                  Page <strong className="text-neutral-900">{currentPage}</strong> of{' '}
                  <strong className="text-neutral-900">{totalPages}</strong>
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => updateFilters({ page: currentPage + 1 })}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition"
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
