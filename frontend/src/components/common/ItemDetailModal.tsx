import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShieldCheck, MapPin, Calendar, Clock, Check, ArrowRight } from 'lucide-react';
import { Button } from './Button';

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
          className="fixed inset-0 bg-brand-navy-950/60 backdrop-blur-md"
        />

        {/* Modal Window with Spring Entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-md hover:scale-105 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Image Side */}
            <div className="relative aspect-square sm:aspect-auto h-64 sm:h-full bg-slate-100 overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Available Now</span>
              </div>
            </div>

            {/* Content Side */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                  {item.category}
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">
                  {item.title}
                </h2>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                    <span>{item.rating}</span>
                  </div>
                  <span>·</span>
                  <span>{item.reviewsCount} campus reviews</span>
                </div>

                {/* Owner Verification Trust Box */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/90 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Lender: {item.ownerName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Campus Handover: {item.pickupLocation || 'Central Library'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Instant approval within 2 hours</span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="pt-2 flex items-baseline justify-between border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400">Daily Rental</span>
                    <div className="text-2xl font-black text-slate-900 font-display">
                      ₹{item.pricePerDay} <span className="text-xs font-normal text-slate-500">/ day</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Security Deposit</span>
                    <div className="text-sm font-bold text-slate-700">
                      ₹{item.deposit || item.pricePerDay * 5} <span className="text-[10px] text-emerald-600 font-normal">(100% Refundable)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    onRequestBooking(item);
                    onClose();
                  }}
                  className="w-full gap-2 shadow-glow-yellow py-3 text-sm font-bold"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Request Rental for Campus Handover</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <div className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
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
