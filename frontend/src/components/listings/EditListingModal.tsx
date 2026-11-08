import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { OwnerListingSummary } from '../../services/listingService';
import { useUpdateListing } from '../../hooks/useListings';

interface EditListingModalProps {
  item: OwnerListingSummary | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  item,
  onClose,
  onSuccess,
}) => {
  const updateMutation = useUpdateListing();

  const [title, setTitle] = useState(item?.title || '');
  const [condition, setCondition] = useState<'BRAND_NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'>(
    item?.condition || 'GOOD'
  );
  const [rentalPrice, setRentalPrice] = useState(item?.rental_price_per_day?.toString() || '30');
  const [deposit, setDeposit] = useState(item?.security_deposit?.toString() || '100');
  const [pickupLocation, setPickupLocation] = useState(item?.pickup_location || 'Central Library Ground Floor');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const priceNum = parseFloat(rentalPrice);
    const depositNum = parseFloat(deposit);

    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage('Daily rental price must be greater than zero.');
      return;
    }

    if (isNaN(depositNum) || depositNum < 0) {
      setErrorMessage('Security deposit cannot be negative.');
      return;
    }

    updateMutation.mutate(
      {
        itemId: item.id,
        data: {
          title,
          condition: condition as any,
          rental_price_per_day: priceNum,
          security_deposit: depositNum,
          pickup_location: pickupLocation,
        },
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
        onError: (err: any) => {
          setErrorMessage(
            err.response?.data?.detail || 'Failed to update listing. Please verify your inputs.'
          );
        },
      }
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 p-6 sm:p-7 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit Listing</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active bookings and agreed rates will be safely preserved.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Item Title</label>
              <input
                type="text"
                required
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as 'BRAND_NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR')
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
              >
                <option value="BRAND_NEW">Brand New (Never used / original box)</option>
                <option value="LIKE_NEW">Like New (Immaculate, barely used)</option>
                <option value="GOOD">Good (Light cosmetic signs, fully functional)</option>
                <option value="FAIR">Fair (Visible signs of wear, fully working)</option>
              </select>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daily Rental (₹)
                </label>
                <input
                  type="number"
                  min="5"
                  step="1"
                  required
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                />
              </div>
            </div>

            {/* Pickup Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campus Pickup Location
              </label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
              >
                <option value="Central Library Ground Floor Counter">Central Library Ground Floor Counter</option>
                <option value="Main Campus Canteen Reception">Main Campus Canteen Reception</option>
                <option value="Campus Gate 1 Security Desk">Campus Gate 1 Security Desk</option>
                <option value="Department of Computer Science Lab B">Department of Computer Science Lab B</option>
                <option value="Student Activity Center Hub">Student Activity Center Hub</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2 rounded-xl bg-[#5B4DFF] hover:bg-[#4E3FE6] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
