import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useListingRentalHistory } from '../../hooks/useListings';
import { OwnerListingSummary } from '../../services/listingService';

interface RentalHistoryModalProps {
  item: OwnerListingSummary | null;
  onClose: () => void;
}

export const RentalHistoryModal: React.FC<RentalHistoryModalProps> = ({ item, onClose }) => {
  const { data, isLoading, isError } = useListingRentalHistory(item ? item.id : null);

  if (!item) return null;

  const records = data?.rental_history || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completed & Returned
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            Active Rental
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            Approved & Awaiting Pickup
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 p-6 sm:p-7 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5B4DFF] flex items-center justify-center">
                <Calendar className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 truncate max-w-sm">
                  {item.title}
                </h2>
                <p className="text-xs text-slate-400">
                  Campus rental history and student transaction log
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                Total Completed Handouts
              </span>
              <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
                {item.rental_count} rentals
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                Current Rental Rate
              </span>
              <span className="text-lg font-extrabold text-[#5B4DFF] mt-0.5 block">
                ₹{item.rental_price_per_day} <span className="text-xs font-normal text-slate-400">/ day</span>
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#5B4DFF]" />
                <span className="text-xs">Loading rental records...</span>
              </div>
            ) : isError ? (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Failed to load rental history. Please try again.</span>
              </div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No rental history yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When a fellow student books this resource, their rental dates, payment, and return records will appear here.
                </p>
              </div>
            ) : (
              records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/70 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-[#5B4DFF] font-bold text-xs flex items-center justify-center">
                        {rec.renter_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {rec.renter_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ref: {rec.booking_reference}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(rec.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(rec.start_date).toLocaleDateString()} –{' '}
                        {new Date(rec.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right font-bold text-slate-900 text-xs">
                      ₹{rec.rental_price_inr}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{rec.pickup_spot}</span>
                    </span>
                    <span>Deposit: ₹{rec.deposit_amount_inr}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
