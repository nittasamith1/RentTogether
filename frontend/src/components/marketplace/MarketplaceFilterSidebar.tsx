import React from 'react';
import {
  Filter,
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
    <aside
      className="w-full rounded-3xl border p-5 shadow-xs flex flex-col gap-6 sticky top-24"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #EAE6E1' }}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: '#7563D9' }} />
          <h3 className="font-bold text-sm" style={{ color: '#303653' }}>Filters & Criteria</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold transition cursor-pointer"
            style={{ color: '#85899B' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7563D9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#85899B')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* 1. Categories */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: '#303653' }}>Categories</label>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onFilterChange({ category: '', page: 1 })}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition text-left cursor-pointer"
            style={{
              backgroundColor: !filters.category ? '#7563D9' : 'transparent',
              color: !filters.category ? '#ffffff' : '#303653',
              fontWeight: !filters.category ? 'bold' : 'normal',
            }}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: isSelected ? '' : cat.slug, page: 1 })}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition text-left cursor-pointer"
                style={{
                  backgroundColor: isSelected ? '#7563D9' : 'transparent',
                  color: isSelected ? '#ffffff' : '#303653',
                  fontWeight: isSelected ? 'bold' : 'normal',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#E9E3FF';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="truncate">{cat.name}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#E9E3FF',
                    color: isSelected ? '#ffffff' : '#7563D9',
                  }}
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
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#303653' }}>
          Daily Rental Rate (₹)
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2 text-xs" style={{ color: '#85899B' }}>₹</span>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.min_price || ''}
              onChange={(e) => onFilterChange({ min_price: e.target.value, page: 1 })}
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl focus:outline-none"
              style={{
                backgroundColor: '#FFF8ED',
                border: '1px solid #EAE6E1',
                color: '#303653',
              }}
            />
          </div>
          <span className="text-xs" style={{ color: '#85899B' }}>—</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2 text-xs" style={{ color: '#85899B' }}>₹</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.max_price || ''}
              onChange={(e) => onFilterChange({ max_price: e.target.value, page: 1 })}
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl focus:outline-none"
              style={{
                backgroundColor: '#FFF8ED',
                border: '1px solid #EAE6E1',
                color: '#303653',
              }}
            />
          </div>
        </div>

        {/* Quick Price Pills */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            { label: 'Under ₹50', min: '', max: '50' },
            { label: '₹50 – ₹150', min: '50', max: '150' },
            { label: '₹150+', min: '150', max: '' },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => onFilterChange({ min_price: p.min, max_price: p.max, page: 1 })}
              className="text-[11px] px-2 py-0.5 rounded-lg border transition cursor-pointer"
              style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E9E3FF')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFF8ED')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Condition */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#303653' }}>Condition</label>
        <div className="grid grid-cols-2 gap-1.5">
          {conditions.map((c) => {
            const isChecked = filters.condition === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onFilterChange({ condition: isChecked ? '' : c.value, page: 1 })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer"
                style={{
                  borderColor: isChecked ? '#7563D9' : '#EAE6E1',
                  backgroundColor: isChecked ? '#E9E3FF' : '#FFFCF7',
                  color: isChecked ? '#7563D9' : '#303653',
                }}
              >
                <div
                  className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isChecked ? '#7563D9' : '#FFFCF7',
                    borderColor: isChecked ? '#7563D9' : '#EAE6E1',
                    color: '#ffffff',
                  }}
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
        <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#303653' }}>
          <Calendar className="w-3.5 h-3.5" style={{ color: '#7563D9' }} />
          Rental Dates Required
        </label>
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-[11px] mb-0.5 block" style={{ color: '#85899B' }}>Start Date</span>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => onFilterChange({ start_date: e.target.value, page: 1 })}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl focus:outline-none"
              style={{
                backgroundColor: '#FFF8ED',
                border: '1px solid #EAE6E1',
                color: '#303653',
              }}
            />
          </div>
          <div>
            <span className="text-[11px] mb-0.5 block" style={{ color: '#85899B' }}>End Date</span>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => onFilterChange({ end_date: e.target.value, page: 1 })}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl focus:outline-none"
              style={{
                backgroundColor: '#FFF8ED',
                border: '1px solid #EAE6E1',
                color: '#303653',
              }}
            />
          </div>
        </div>
      </div>

      {/* 6. Campus Pickup Location */}
      {pickupSpots.length > 0 && (
        <div>
          <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#303653' }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: '#7563D9' }} />
            Campus Pickup Spot
          </label>
          <select
            value={filters.pickup_spot || ''}
            onChange={(e) => onFilterChange({ pickup_spot: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 text-xs rounded-xl focus:outline-none"
            style={{
              backgroundColor: '#FFF8ED',
              border: '1px solid #EAE6E1',
              color: '#303653',
            }}
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
        <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#303653' }}>
          <Star className="w-3.5 h-3.5" style={{ color: '#E8A447' }} />
          Owner Reputation
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {ratingOptions.map((opt) => {
            const isSelected = (filters.min_rating || '') === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onFilterChange({ min_rating: isSelected ? '' : opt.value, page: 1 })}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium border text-center transition cursor-pointer"
                style={{
                  borderColor: isSelected ? '#7563D9' : '#EAE6E1',
                  backgroundColor: isSelected ? '#E9E3FF' : '#FFFCF7',
                  color: isSelected ? '#7563D9' : '#303653',
                  fontWeight: isSelected ? 'bold' : 'normal',
                }}
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
