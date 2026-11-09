import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [pickupLocation, setPickupLocation] = useState(item?.pickup_location || 'Central Library Ground Floor');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const priceNum = parseFloat(rentalPrice);

    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage('Daily rental price must be greater than zero.');
      return;
    }

    updateMutation.mutate(
      {
        itemId: item.id,
        data: {
          title,
          condition: condition as any,
          rental_price_per_day: priceNum,
          security_deposit: 0,
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

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#303653]/60 backdrop-blur-xs p-4 flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden z-10 my-auto p-6 sm:p-7 space-y-5"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #EAE6E1' }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#303653' }}>Edit Listing</h2>
              <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
                Active bookings and agreed rates will be safely preserved.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              style={{ backgroundColor: '#FFF8ED', color: '#85899B' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div
              className="p-3 rounded-xl border text-xs flex items-center gap-2"
              style={{ backgroundColor: '#FFF0F0', borderColor: '#F28B82', color: '#E87575' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>Item Title</label>
              <input
                type="text"
                required
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden transition-all"
                style={{
                  backgroundColor: '#FFF8ED',
                  border: '1px solid #EAE6E1',
                  color: '#303653',
                }}
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>Condition</label>
              <select
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as 'BRAND_NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR')
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden"
                style={{
                  backgroundColor: '#FFF8ED',
                  border: '1px solid #EAE6E1',
                  color: '#303653',
                }}
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
                <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>
                  Daily Rental (₹)
                </label>
                <input
                  type="number"
                  min="5"
                  step="1"
                  required
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden"
                  style={{
                    backgroundColor: '#FFF8ED',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
                />
                <p className="text-[10px] mt-1 font-semibold" style={{ color: '#7563D9' }}>
                  Hourly: ₹{((parseFloat(rentalPrice) || 0) / 24).toFixed(2)}/hr (₹/24)
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>
                  Security Deposit
                </label>
                <div
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between"
                  style={{
                    backgroundColor: '#DDF3E7',
                    border: '1px solid #B8E5CC',
                    color: '#2D7A5B',
                  }}
                >
                  <span>Zero Deposit</span>
                  <span>₹0.00</span>
                </div>
              </div>
            </div>

            {/* Pickup Location */}
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>
                Campus Pickup Location
              </label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden"
                style={{
                  backgroundColor: '#FFF8ED',
                  border: '1px solid #EAE6E1',
                  color: '#303653',
                }}
              >
                <option value="Central Library Ground Floor Counter">Central Library Ground Floor Counter</option>
                <option value="Main Campus Canteen Reception">Main Campus Canteen Reception</option>
                <option value="Campus Gate 1 Security Desk">Campus Gate 1 Security Desk</option>
                <option value="Department of Computer Science Lab B">Department of Computer Science Lab B</option>
                <option value="Student Activity Center Hub">Student Activity Center Hub</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3" style={{ borderTop: '1px solid #EAE6E1' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ color: '#85899B' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                style={{ backgroundColor: '#7563D9' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
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
    </AnimatePresence>,
    document.body
  );
};
