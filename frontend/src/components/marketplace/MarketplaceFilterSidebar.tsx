import React from 'react';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Calendar,
  MapPin,
  Star,
  Check,
} from 'lucide-react';
import { Category, MarketplaceFilterParams } from '../../services/marketplace';

interface MarketplaceFilterSidebarProps {
  categories: Category[];
  filters: MarketplaceFilterParams;
  onFilterChange: (newFilters: Partial<MarketplaceFilterParams>) => void;
  onReset: () => void;
  pickupSpots: string[];
}

export const MarketplaceFilterSidebar: React.FC<MarketplaceFilterSidebarProps> = ({
  categories,
  filters,
  onFilterChange,
  onReset,
  pickupSpots,
}) => {
  const conditions = [
    { value: 'BRAND_NEW', label: 'Brand New' },
    { value: 'LIKE_NEW', label: 'Like New' },
    { value: 'GOOD', label: 'Good' },
    { value: 'FAIR', label: 'Fair' },
  ];

  const ratingOptions = [
    { value: '', label: 'Any Rating' },
    { value: '4.0', label: '4.0+ Stars' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.8', label: '4.8+ Stars' },
  ];

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.category ||
      filters.min_price ||
      filters.max_price ||
      filters.condition ||
      filters.start_date ||
      filters.end_date ||
      filters.availability ||
      filters.pickup_spot ||
      filters.min_rating
  );

  return (
    <aside className="w-full bg-white rounded-3xl border border-neutral-200/80 p-5 shadow-xs flex flex-col gap-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-neutral-900 text-sm">Filters & Criteria</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-amber-600 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* 1. Search Box */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Search Resources</label>
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search title, brand, specs..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-neutral-900"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Categories */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-2">Categories</label>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onFilterChange({ category: '', page: 1 })}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition text-left ${
              !filters.category
                ? 'bg-amber-500 text-white font-semibold shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: isSelected ? '' : cat.slug, page: 1 })}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition text-left ${
                  isSelected
                    ? 'bg-amber-500 text-white font-semibold shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-amber-600 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {cat.eligible_item_count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Price Range (INR/day) */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
          Daily Rental Rate (₹)
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2 text-xs text-neutral-400">₹</span>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.min_price || ''}
              onChange={(e) => onFilterChange({ min_price: e.target.value, page: 1 })}
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-900"
            />
          </div>
          <span className="text-neutral-400 text-xs">—</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2 text-xs text-neutral-400">₹</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.max_price || ''}
              onChange={(e) => onFilterChange({ max_price: e.target.value, page: 1 })}
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-900"
            />
          </div>
        </div>

        {/* Quick Price Pills */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <button
            onClick={() => onFilterChange({ min_price: '', max_price: '50', page: 1 })}
            className="text-[11px] px-2 py-0.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
          >
            Under ₹50
          </button>
          <button
            onClick={() => onFilterChange({ min_price: '50', max_price: '150', page: 1 })}
            className="text-[11px] px-2 py-0.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
          >
            ₹50 – ₹150
          </button>
          <button
            onClick={() => onFilterChange({ min_price: '150', max_price: '', page: 1 })}
            className="text-[11px] px-2 py-0.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
          >
            ₹150+
          </button>
        </div>
      </div>

      {/* 4. Condition */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Condition</label>
        <div className="grid grid-cols-2 gap-1.5">
          {conditions.map((c) => {
            const isChecked = filters.condition === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onFilterChange({ condition: isChecked ? '' : c.value, page: 1 })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                  isChecked
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'border-neutral-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className="truncate">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Date Availability Range */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
          Rental Dates Required
        </label>
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-[11px] text-neutral-500 mb-0.5 block">Start Date</span>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => onFilterChange({ start_date: e.target.value, page: 1 })}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-800"
            />
          </div>
          <div>
            <span className="text-[11px] text-neutral-500 mb-0.5 block">End Date</span>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => onFilterChange({ end_date: e.target.value, page: 1 })}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-800"
            />
          </div>
        </div>
      </div>

      {/* 6. Campus Pickup Location */}
      {pickupSpots.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-neutral-500" />
            Campus Pickup Spot
          </label>
          <select
            value={filters.pickup_spot || ''}
            onChange={(e) => onFilterChange({ pickup_spot: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-800"
          >
            <option value="">All Campus Spots</option>
            {pickupSpots.map((spot) => (
              <option key={spot} value={spot}>
                {spot}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 7. Minimum Owner Rating */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          Owner Reputation
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {ratingOptions.map((opt) => {
            const isSelected = (filters.min_rating || '') === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onFilterChange({ min_rating: isSelected ? '' : opt.value, page: 1 })}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border text-center transition ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
