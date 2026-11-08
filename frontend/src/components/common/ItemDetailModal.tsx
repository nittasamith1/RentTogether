import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShieldCheck, MapPin, Calendar, Clock, Check, ArrowRight } from 'lucide-react';

export interface ModalResourceItem {
  id: string;
  title: string;
  category: string;
  pricePerDay: number;
  rating: number;
  reviewsCount: number;
  image: string;
  ownerName: string;
  deposit?: number;
  pickupLocation?: string;
}

interface ItemDetailModalProps {
  item: ModalResourceItem | null;
  onClose: () => void;
  onRequestBooking: (item: ModalResourceItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onRequestBooking,
}) => {
  if (!item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#303653]/60 backdrop-blur-md"
        />

        {/* Modal Window with Spring Entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden z-10 my-8"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center shadow-md transition-all cursor-pointer"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#85899B' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Image Side */}
            <div className="relative aspect-square sm:aspect-auto h-64 sm:h-full overflow-hidden" style={{ backgroundColor: '#E9E3FF' }}>
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs" style={{ color: '#7563D9' }}>
                  <span>{item.category}</span>
                </div>
              )}
              <div
                className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md text-xs font-bold shadow-sm"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#303653' }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#42A879' }} />
                <span>Available Now</span>
              </div>
            </div>

            {/* Content Side */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div
                  className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                  style={{ backgroundColor: '#E9E3FF', color: '#7563D9', borderColor: '#D8D0F5' }}
                >
                  {item.category}
                </div>

                <h2 className="text-2xl font-black tracking-tight" style={{ color: '#303653' }}>
                  {item.title}
                </h2>

                <div className="flex items-center gap-2 text-xs" style={{ color: '#85899B' }}>
                  <div className="flex items-center font-bold" style={{ color: '#E8A447' }}>
                    <Star className="w-3.5 h-3.5 fill-[#E8A447] mr-1" />
                    <span>{item.rating}</span>
                  </div>
                  <span>·</span>
                  <span>{item.reviewsCount} campus reviews</span>
                </div>

                {/* Owner Verification Trust Box */}
                <div
                  className="p-3 rounded-2xl border space-y-1.5"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#303653' }}>
                    <ShieldCheck className="w-4 h-4" style={{ color: '#42A879' }} />
                    <span>Lender: {item.ownerName}</span>
                  </div>
                  <div className="text-[11px] flex items-center gap-1.5" style={{ color: '#85899B' }}>
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#7563D9' }} />
                    <span>Campus Handover: {item.pickupLocation || 'Central Library'}</span>
                  </div>
                  <div className="text-[11px] flex items-center gap-1.5" style={{ color: '#85899B' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#85899B' }} />
                    <span>Instant approval within 2 hours</span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="pt-2 flex items-baseline justify-between" style={{ borderTop: '1px solid #EAE6E1' }}>
                  <div>
                    <span className="text-xs" style={{ color: '#85899B' }}>Daily Rental</span>
                    <div className="text-2xl font-black" style={{ color: '#303653' }}>
                      ₹{item.pricePerDay} <span className="text-xs font-normal" style={{ color: '#85899B' }}>/ day</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs" style={{ color: '#85899B' }}>Security Deposit</span>
                    <div className="text-sm font-bold" style={{ color: '#303653' }}>
                      ₹{item.deposit || item.pricePerDay * 5} <span className="text-[10px] font-normal" style={{ color: '#42A879' }}>(100% Refundable)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onRequestBooking(item);
                    onClose();
                  }}
                  className="w-full py-3 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                  style={{ backgroundColor: '#7563D9' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Request Rental for Campus Handover</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-[11px] text-center flex items-center justify-center gap-1" style={{ color: '#85899B' }}>
                  <Check className="w-3.5 h-3.5" style={{ color: '#42A879' }} />
                  <span>No upfront payment until owner approves</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
