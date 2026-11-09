import React, { useState } from 'react';
import {
  MapPin,
  Edit3,
  Trash2,
  Layers,
  AlertTriangle,
  Loader2,
  History,
} from 'lucide-react';
import { OwnerListingSummary } from '../../services/listingService';
import { ListingStatusBadge } from './ListingStatusBadge';
import { useUpdateListingStatus, useDeleteListing } from '../../hooks/useListings';

interface ListingCardProps {
  item: OwnerListingSummary;
  onEdit: (item: OwnerListingSummary) => void;
  onViewDetails?: (itemId: string) => void;
  onViewHistory?: (item: OwnerListingSummary) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  item,
  onEdit,
  onViewDetails,
  onViewHistory,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const statusMutation = useUpdateListingStatus();
  const deleteMutation = useDeleteListing();

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    statusMutation.mutate({ itemId: item.id, status: nextStatus });
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(item.id, {
      onSuccess: () => setShowDeleteConfirm(false),
    });
  };

  const conditionLabels: Record<string, string> = {
    BRAND_NEW: 'Brand New',
    LIKE_NEW: 'Like New',
    GOOD: 'Good',
    FAIR: 'Fair',
  };

  return (
    <div
      className="rounded-2xl border shadow-xs hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
    >
      <div>
        {/* Card Image Area with Status & Category Overlay */}
        <div className="relative aspect-4/3 w-full overflow-hidden" style={{ backgroundColor: '#E9E3FF' }}>
          {item.primary_image_url ? (
            <img
              src={item.primary_image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: '#85899B' }}>
              <Layers className="w-8 h-8 stroke-[1.5]" />
              <span className="text-xs font-semibold mt-1">RentTogether</span>
            </div>
          )}

          {/* Top Status & Condition Overlay */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
            <ListingStatusBadge status={item.status} size="sm" />
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs border"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
            >
              {conditionLabels[item.condition] || item.condition}
            </span>
          </div>

          {/* Category Chip */}
          <div className="absolute bottom-2.5 left-2.5">
            <span
              className="text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs"
              style={{ backgroundColor: 'rgba(48, 54, 83, 0.85)' }}
            >
              {item.category_name}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          <div>
            <h3
              onClick={() => onViewDetails && onViewDetails(item.id)}
              className="text-sm font-bold transition-colors line-clamp-1 cursor-pointer hover:text-[#7563D9]"
              style={{ color: '#303653' }}
            >
              {item.title}
            </h3>

            {/* Pickup Location */}
            <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: '#85899B' }}>
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#7563D9' }} />
              <span className="truncate">{item.pickup_location || 'Campus Center'}</span>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="flex items-baseline justify-between pt-1" style={{ borderTop: '1px solid #EAE6E1' }}>
            <div>
              <span className="text-base font-extrabold" style={{ color: '#303653' }}>
                ₹{item.rental_price_per_day}
              </span>
              <span className="text-xs font-normal ml-1" style={{ color: '#85899B' }}>/ day</span>
            </div>
            <div className="text-right text-[11px] font-medium" style={{ color: '#85899B' }}>
              Deposit: <span className="font-bold" style={{ color: '#303653' }}>₹{item.security_deposit}</span>
            </div>
          </div>

          {/* Performance & Bookings Stats */}
          <div className="grid grid-cols-2 gap-2 p-2 rounded-xl text-center text-xs" style={{ backgroundColor: '#FFF8ED', border: '1px solid #EAE6E1' }}>
            <div>
              <span className="text-[10px] block font-medium" style={{ color: '#85899B' }}>Rentals</span>
              <span className="font-bold" style={{ color: '#303653' }}>{item.rental_count} completed</span>
            </div>
            <div>
              <span className="text-[10px] block font-medium" style={{ color: '#85899B' }}>Active</span>
              <span
                className="font-bold"
                style={{ color: item.active_bookings_count > 0 ? '#7563D9' : '#85899B' }}
              >
                {item.active_bookings_count} ongoing
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 pt-0" style={{ borderTop: '1px solid #EAE6E1', backgroundColor: '#FFFCF7' }}>
        {/* Toggle Delete Confirm Drawer */}
        {showDeleteConfirm ? (
          <div
            className="p-2.5 rounded-xl border space-y-2 mt-2"
            style={{ backgroundColor: '#FFF0F0', borderColor: '#F28B82' }}
          >
            <div className="flex items-start gap-2 text-xs font-semibold" style={{ color: '#E87575' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Remove this listing? Past bookings will remain safe.</span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg cursor-pointer"
                style={{ color: '#85899B' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1 text-xs font-bold text-white rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                style={{ backgroundColor: '#E87575' }}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span>Remove</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-2.5">
            {/* Quick Pause / Resume Toggle Switch */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={statusMutation.isPending}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden"
                style={{
                  backgroundColor: item.status === 'ACTIVE' ? '#42A879' : '#EAE6E1',
                }}
                title={item.status === 'ACTIVE' ? 'Click to Pause listing' : 'Click to Resume listing'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    item.status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-[11px] font-bold" style={{ color: '#303653' }}>
                {statusMutation.isPending ? 'Updating...' : item.status === 'ACTIVE' ? 'Live' : 'Paused'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Rental History Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewHistory) onViewHistory(item);
                }}
                title="View rental transaction history"
                className="p-1.5 px-2 rounded-xl border flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-all"
                style={{
                  backgroundColor: '#E9E3FF',
                  borderColor: '#D8D0F5',
                  color: '#7563D9',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D8D0F5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E9E3FF')}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>

              {/* Edit Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                title="Edit listing details"
                className="p-1.5 rounded-xl border transition-colors cursor-pointer"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF8ED')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFCF7')}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                title="Delete or unpublish item"
                className="p-1.5 rounded-xl border transition-colors cursor-pointer"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#F28B82' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF0F0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFCF7')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
