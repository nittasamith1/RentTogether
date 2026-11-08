import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden flex flex-col justify-between group"
    >
      <div>
        {/* Card Image Area with Status & Category Overlay */}
        <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
          {item.primary_image_url ? (
            <img
              src={item.primary_image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
              <Layers className="w-8 h-8 stroke-[1.5]" />
              <span className="text-xs font-semibold mt-1">RentTogether</span>
            </div>
          )}

          {/* Top Status & Condition Overlay */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
            <ListingStatusBadge status={item.status} size="sm" />
            <span className="bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-slate-200/60">
              {conditionLabels[item.condition] || item.condition}
            </span>
          </div>

          {/* Category Chip */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="bg-[#1E1B4B]/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs">
              {item.category_name}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          <div>
            <h3
              onClick={() => onViewDetails && onViewDetails(item.id)}
              className="text-sm font-bold text-slate-900 group-hover:text-[#5B4DFF] transition-colors line-clamp-1 cursor-pointer"
            >
              {item.title}
            </h3>

            {/* Pickup Location */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.pickup_location || 'Campus Center'}</span>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
            <div>
              <span className="text-base font-extrabold text-slate-900">
                ₹{item.rental_price_per_day}
              </span>
              <span className="text-xs text-slate-400 font-normal ml-1">/ day</span>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-medium">
              Deposit: <span className="font-bold text-slate-700">₹{item.security_deposit}</span>
            </div>
          </div>

          {/* Performance & Bookings Stats */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Rentals</span>
              <span className="font-bold text-slate-800">{item.rental_count} completed</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Active</span>
              <span
                className={`font-bold ${
                  item.active_bookings_count > 0 ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                {item.active_bookings_count} ongoing
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 pt-0 border-t border-slate-100/80 bg-white">
        {/* Toggle Delete Confirm Drawer */}
        {showDeleteConfirm ? (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2 mt-2">
            <div className="flex items-start gap-2 text-rose-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>Remove this listing? Past bookings will remain safe.</span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-1 shadow-xs cursor-pointer"
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
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
                title={item.status === 'ACTIVE' ? 'Click to Pause listing' : 'Click to Resume listing'}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    item.status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-[11px] font-bold text-slate-600">
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
                className="p-1.5 px-2 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-[#5B4DFF] transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
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
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
