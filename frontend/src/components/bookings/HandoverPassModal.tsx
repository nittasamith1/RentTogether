import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  MapPin,
  Copy,
  Check,
  RotateCw,
  Clock,
  AlertCircle
} from 'lucide-react';
import { BookingSummary, BookingDetail } from '../../services/bookingService';
import { useDialog } from '../../context/DialogContext';
import { useHandoverPass, useRegenerateHandoverPass } from '../../hooks/useBookings';
import { QRCodeView } from '../common/QRCodeView';

interface HandoverPassModalProps {
  booking: BookingSummary | BookingDetail | null;
  onClose: () => void;
}

export const HandoverPassModal: React.FC<HandoverPassModalProps> = ({
  booking,
  onClose,
}) => {
  const dialog = useDialog();
  const [copied, setCopied] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const { data: passData, isLoading, isError, refetch } = useHandoverPass(
    booking ? booking.id : null,
    Boolean(booking)
  );

  const regenerateMutation = useRegenerateHandoverPass();

  // Calculate live countdown timer
  useEffect(() => {
    if (!passData?.expires_at) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(passData.expires_at).getTime();
      const diffSeconds = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(diffSeconds);
      if (diffSeconds === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [passData?.expires_at]);

  if (!booking) return null;

  const isPickup = passData?.stage === 'PICKUP' || booking.status === 'PAID_CONFIRMED';
  const stageTitle = isPickup ? 'Campus Item Handover Pass' : 'Campus Return Handback Pass';
  const stageSubtitle = isPickup
    ? 'Display this pass to the renter at the campus meetup point to initiate physical handover.'
    : 'Display this pass to the owner at the campus meetup point to complete item return.';

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync(booking.id);
      refetch();
    } catch (err: any) {
      dialog.showToast(err.response?.data?.detail || 'Failed to regenerate pass.', 'error');
    }
  };

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
          <div className="text-center space-y-1.5 pt-1">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                backgroundColor: isPickup ? '#E9E3FF' : '#DDF3E7',
                borderColor: isPickup ? '#D8D0F5' : '#B8E5CC',
                color: isPickup ? '#7563D9' : '#2D7A5B',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isPickup ? 'Owner Handover Pass' : 'Renter Return Pass'}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight" style={{ color: '#303653' }}>
              {stageTitle}
            </h2>
            <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: '#85899B' }}>
              {stageSubtitle}
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#7563D9] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold" style={{ color: '#85899B' }}>
                Generating cryptographic credentials...
              </p>
            </div>
          ) : isError || !passData ? (
            <div
              className="p-5 rounded-2xl border text-center space-y-3"
              style={{ backgroundColor: '#FFF0F0', borderColor: '#F28B82' }}
            >
              <AlertCircle className="w-7 h-7 mx-auto text-rose-500" />
              <h4 className="text-xs font-bold" style={{ color: '#303653' }}>Pass Unavailable</h4>
              <p className="text-[11px]" style={{ color: '#85899B' }}>
                Only the authorized party can view this pass when the booking is in the appropriate stage.
              </p>
            </div>
          ) : (
            <>
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div
                  className="p-4 rounded-3xl border shadow-sm flex items-center justify-center relative"
                  style={{ backgroundColor: '#FFFCF7', borderColor: '#D8D0F5' }}
                >
                  <QRCodeView
                    value={passData.qr_payload}
                    size={190}
                    fgColor="#303653"
                    bgColor="#FFFCF7"
                  />
                  {timeLeft === 0 && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-4 text-center">
                      <Clock className="w-6 h-6 text-amber-500 mb-1" />
                      <span className="text-xs font-bold text-neutral-800">Pass Expired</span>
                      <button
                        onClick={handleRegenerate}
                        className="mt-2 text-xs font-bold px-3 py-1.5 rounded-xl text-white bg-[#7563D9]"
                      >
                        Regenerate Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Expiration Countdown */}
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" style={{ color: timeLeft < 60 ? '#E87575' : '#85899B' }} />
                  <span style={{ color: timeLeft < 60 ? '#E87575' : '#85899B' }}>
                    Expires in: <strong className="font-mono">{formatTimer(timeLeft)}</strong>
                  </span>
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerateMutation.isPending}
                    className="p-1 rounded-md text-[#7563D9] hover:bg-[#E9E3FF] transition cursor-pointer"
                    title="Regenerate pass"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 6-Digit OTP Fallback */}
              <div
                className="rounded-2xl p-4 border text-center space-y-1.5"
                style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#85899B' }}>
                  Manual 6-Digit Exchange Passcode
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black font-mono tracking-widest" style={{ color: '#303653' }}>
                    {passData.otp}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(passData.otp)}
                    className="p-1.5 rounded-xl border transition shadow-xs cursor-pointer"
                    style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#7563D9' }}
                    title="Copy passcode"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Campus Meetup Details */}
              <div
                className="p-3.5 rounded-2xl border space-y-1 text-xs"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
              >
                <div className="flex items-center gap-2 font-semibold" style={{ color: '#303653' }}>
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: '#7563D9' }} />
                  <span>Meetup: <strong>{passData.pickup_spot || 'Campus Handover Desk'}</strong></span>
                </div>
                <div className="text-[11px] pl-6" style={{ color: '#85899B' }}>
                  Meeting with: <strong>{passData.counterpart_name}</strong> for {passData.item_title}.
                </div>
              </div>

              {/* Anti-fraud security footer */}
              <p className="text-[10px] text-center" style={{ color: '#85899B' }}>
                Single-use cryptographically hashed token · Automatically self-destructs after verification
              </p>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
