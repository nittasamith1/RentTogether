import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  QrCode
} from 'lucide-react';
import { BookingSummary, BookingDetail } from '../../services/bookingService';
import { useVerifyPickup, useVerifyReturn } from '../../hooks/useBookings';

interface HandoverVerificationModalProps {
  booking: BookingSummary | BookingDetail | null;
  stage: 'PICKUP' | 'RETURN';
  onClose: () => void;
  onSuccess: () => void;
}

export const HandoverVerificationModal: React.FC<HandoverVerificationModalProps> = ({
  booking,
  stage,
  onClose,
  onSuccess,
}) => {
  const [method, setMethod] = useState<'OTP' | 'QR'>('OTP');
  const [code, setCode] = useState<string>('');
  const [condition, setCondition] = useState<string>(stage === 'PICKUP' ? 'GOOD' : 'SAME');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyPickupMutation = useVerifyPickup();
  const verifyReturnMutation = useVerifyReturn();

  if (!booking) return null;

  const isPickup = stage === 'PICKUP';
  const modalTitle = isPickup ? 'Verify Item Handover Receipt' : 'Verify Item Return Handback';
  const modalSubtitle = isPickup
    ? `Confirm physical receipt of "${booking.item_title}" from owner ${booking.owner_name}.`
    : `Confirm physical return of "${booking.item_title}" from renter ${booking.renter_name}.`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim();
    if (!cleanCode) {
      setErrorMessage(method === 'OTP' ? 'Please enter the 6-digit exchange passcode.' : 'Please enter the QR token payload.');
      return;
    }

    try {
      if (isPickup) {
        await verifyPickupMutation.mutateAsync({
          bookingId: booking.id,
          payload: {
            method,
            otp: method === 'OTP' ? cleanCode : undefined,
            token: method === 'QR' ? cleanCode : undefined,
            pickup_condition: condition as any,
            pickup_notes: notes.trim() || undefined,
          },
        });
      } else {
        await verifyReturnMutation.mutateAsync({
          bookingId: booking.id,
          payload: {
            method,
            otp: method === 'OTP' ? cleanCode : undefined,
            token: method === 'QR' ? cleanCode : undefined,
            return_item_condition: condition as any,
            return_notes: notes.trim() || undefined,
          },
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Verification failed. Please check the code with your peer.';
      setErrorMessage(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  const isSubmitting = verifyPickupMutation.isPending || verifyReturnMutation.isPending;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#303653]/60 backdrop-blur-xs p-4 flex min-h-screen items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden z-10 my-auto p-6 sm:p-7 space-y-5"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full border flex items-center justify-center transition cursor-pointer"
            style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#85899B' }}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="space-y-1">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                backgroundColor: isPickup ? '#E9E3FF' : '#DDF3E7',
                borderColor: isPickup ? '#D8D0F5' : '#B8E5CC',
                color: isPickup ? '#7563D9' : '#2D7A5B',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isPickup ? 'Renter Pickup Verification' : 'Owner Return Inspection'}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight" style={{ color: '#303653' }}>
              {modalTitle}
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: '#85899B' }}>
              {modalSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Verification Method Switcher */}
            <div
              className="p-1 rounded-2xl border flex items-center text-xs font-bold"
              style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
            >
              <button
                type="button"
                onClick={() => setMethod('OTP')}
                className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'OTP' ? 'bg-white shadow-xs font-bold text-[#7563D9]' : 'text-[#303653]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>6-Digit Passcode</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('QR')}
                className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'QR' ? 'bg-white shadow-xs font-bold text-[#7563D9]' : 'text-[#303653]'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Token Payload</span>
              </button>
            </div>

            {/* Code Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold block" style={{ color: '#303653' }}>
                {method === 'OTP' ? 'Enter 6-Digit Code Displayed by Peer' : 'Paste QR Token Payload'}
              </label>
              <input
                type="text"
                placeholder={method === 'OTP' ? 'e.g. 849201' : 'e.g. RT-PASS:PICKUP:...'}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={method === 'OTP' ? 12 : 256}
                className="w-full text-sm font-mono font-bold p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#7563D9] text-center tracking-widest"
                style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
                autoFocus
              />
            </div>

            {/* Condition Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold block" style={{ color: '#303653' }}>
                {isPickup ? 'Observed Item Condition at Pickup' : 'Observed Item Condition upon Return'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {isPickup
                  ? [
                      { id: 'LIKE_NEW', label: 'Like New' },
                      { id: 'GOOD', label: 'Good' },
                      { id: 'FAIR', label: 'Fair / Worn' },
                      { id: 'NEW', label: 'Brand New' },
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCondition(c.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                          condition === c.id ? 'border-[#7563D9] bg-[#E9E3FF] text-[#7563D9]' : 'border-[#EAE6E1] bg-[#FFFCF7] text-[#303653]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))
                  : [
                      { id: 'SAME', label: 'Same as Handover' },
                      { id: 'MINOR_WEAR', label: 'Minor Normal Wear' },
                      { id: 'DAMAGED', label: 'Noticeable Damage' },
                      { id: 'MISSING_ACCESSORIES', label: 'Missing Accessories' },
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCondition(c.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                          condition === c.id ? 'border-[#7563D9] bg-[#E9E3FF] text-[#7563D9]' : 'border-[#EAE6E1] bg-[#FFFCF7] text-[#303653]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold block" style={{ color: '#303653' }}>
                Exchange Notes / Accessories (Optional)
              </label>
              <input
                type="text"
                placeholder={isPickup ? 'e.g. Received with charger & case...' : 'e.g. Inspected on campus, cables intact...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#7563D9]"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
              />
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div
                className="p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2"
                style={{ backgroundColor: '#FFF0F0', borderColor: '#F28B82', color: '#E87575' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-xs font-bold text-white rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#7563D9' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isPickup ? 'Confirm Item Possession & Activate Rental' : 'Confirm Return Handback'}
                  </span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
