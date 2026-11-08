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
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
            style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
          >
            Completed & Returned
          </span>
        );
      case 'ACTIVE':
        return (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold border animate-pulse"
            style={{ backgroundColor: '#E9E3FF', color: '#7563D9', borderColor: '#D8D0F5' }}
          >
            Active Rental
          </span>
        );
      case 'APPROVED':
        return (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
            style={{ backgroundColor: '#DFEDFF', color: '#6398D6', borderColor: '#C5DCFA' }}
          >
            Approved & Awaiting Pickup
          </span>
        );
      case 'CANCELLED':
        return (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
            style={{ backgroundColor: '#FFF0F0', color: '#E87575', borderColor: '#F28B82' }}
          >
            Cancelled
          </span>
        );
      default:
        return (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
            style={{ backgroundColor: '#FFF8ED', color: '#85899B', borderColor: '#EAE6E1' }}
          >
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
          className="fixed inset-0 bg-[#303653]/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-xl rounded-3xl shadow-2xl border overflow-hidden z-10 p-6 sm:p-7 space-y-5"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #EAE6E1' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
              >
                <Calendar className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-lg font-bold truncate max-w-sm" style={{ color: '#303653' }}>
                  {item.title}
                </h2>
                <p className="text-xs" style={{ color: '#85899B' }}>
                  Campus rental history and student transaction log
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              style={{ backgroundColor: '#FFF8ED', color: '#85899B' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* KPI Summary Strip */}
          <div
            className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl border text-xs"
            style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
          >
            <div>
              <span className="text-[10px] font-semibold block uppercase tracking-wider" style={{ color: '#85899B' }}>
                Total Completed Handouts
              </span>
              <span className="text-lg font-extrabold mt-0.5 block" style={{ color: '#303653' }}>
                {item.rental_count} rentals
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold block uppercase tracking-wider" style={{ color: '#85899B' }}>
                Current Rental Rate
              </span>
              <span className="text-lg font-extrabold mt-0.5 block" style={{ color: '#7563D9' }}>
                ₹{item.rental_price_per_day} <span className="text-xs font-normal" style={{ color: '#85899B' }}>/ day</span>
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2" style={{ color: '#85899B' }}>
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#7563D9' }} />
                <span className="text-xs">Loading rental records...</span>
              </div>
            ) : isError ? (
              <div
                className="p-4 rounded-2xl text-xs flex items-center gap-2 border"
                style={{ backgroundColor: '#FFF0F0', borderColor: '#F28B82', color: '#E87575' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Failed to load rental history. Please try again.</span>
              </div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Clock className="w-8 h-8 mx-auto" style={{ color: '#85899B' }} />
                <h4 className="text-sm font-bold" style={{ color: '#303653' }}>No rental history yet</h4>
                <p className="text-xs max-w-sm mx-auto" style={{ color: '#85899B' }}>
                  When a fellow student books this resource, their rental dates, payment, and return records will appear here.
                </p>
              </div>
            ) : (
              records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl border transition-colors space-y-2"
                  style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center"
                        style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
                      >
                        {rec.renter_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold block" style={{ color: '#303653' }}>
                          {rec.renter_name}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: '#85899B' }}>
                          Ref: {rec.booking_reference}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(rec.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 text-slate-600" style={{ borderTop: '1px solid #EAE6E1' }}>
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#85899B' }}>
                      <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: '#85899B' }} />
                      <span>
                        {new Date(rec.start_date).toLocaleDateString()} –{' '}
                        {new Date(rec.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right font-bold text-xs" style={{ color: '#303653' }}>
                      ₹{rec.rental_price_inr}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px]" style={{ color: '#85899B' }}>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" style={{ color: '#7563D9' }} />
                      <span>{rec.pickup_spot}</span>
                    </span>
                    <span>Deposit: ₹{rec.deposit_amount_inr}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 flex justify-end" style={{ borderTop: '1px solid #EAE6E1' }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D8D0F5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E9E3FF')}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
