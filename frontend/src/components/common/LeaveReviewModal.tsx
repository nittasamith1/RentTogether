import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { profileService } from '../../services/profile';
import { StudentReviewCreatePayload } from '../../types';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingReference: string;
  itemTitle: string;
  partnerName: string;
  defaultReviewType: 'OWNER' | 'RENTER'; // 'OWNER' means reviewer is renter reviewing owner; 'RENTER' means reviewer is owner reviewing renter
  onReviewSubmitted?: () => void;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingReference,
  itemTitle,
  partnerName,
  defaultReviewType,
  onReviewSubmitted,
}) => {
  const [reviewType] = useState<'OWNER' | 'RENTER'>(defaultReviewType);
  const isReviewingOwner = reviewType === 'OWNER';

  // Owner evaluation criteria
  const [conditionScore, setConditionScore] = useState<number>(5);
  const [communicationScore, setCommunicationScore] = useState<number>(5);
  const [punctualityScore, setPunctualityScore] = useState<number>(5);

  // Renter evaluation criteria
  const [onTimeScore, setOnTimeScore] = useState<number>(5);
  const [itemCareScore, setItemCareScore] = useState<number>(5);

  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Real-time calculation preview
  const calculatePreviewScore = () => {
    if (isReviewingOwner) {
      const cond = conditionScore;
      const commPunct = (communicationScore + punctualityScore) / 2;
      return (cond * 0.70 + commPunct * 0.30).toFixed(2);
    } else {
      return (onTimeScore * 0.60 + itemCareScore * 0.40).toFixed(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: StudentReviewCreatePayload = {
      booking_id: bookingId,
      review_type: reviewType,
      overall_comment: comment.trim(),
    };

    if (isReviewingOwner) {
      payload.condition_accuracy_score = conditionScore;
      payload.communication_score = communicationScore;
      payload.punctuality_score = punctualityScore;
    } else {
      payload.on_time_return_score = onTimeScore;
      payload.item_care_score = itemCareScore;
    }

    try {
      await profileService.submitReview(payload);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onReviewSubmitted) onReviewSubmitted();
      }, 1500);
    } catch (err: any) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        const firstErr = Object.values(data)[0];
        setErrorMsg(Array.isArray(firstErr) ? firstErr[0] : String(firstErr || 'Failed to submit review'));
      } else {
        setErrorMsg('An unexpected error occurred while saving your review.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarSelector = (
    label: string,
    description: string,
    value: number,
    onChange: (val: number) => void,
    weightLabel?: string
  ) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">{label}</span>
            {weightLabel && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#5B4DFF]/10 text-[#5B4DFF]">
                {weightLabel}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => onChange(star)}
              className="p-1 hover:scale-110 transition-transform focus:outline-none"
              title={`${star} Star`}
            >
              <Star
                className={`w-5 h-5 ${
                  star <= value
                    ? 'fill-[#F5A623] text-[#F5A623]'
                    : 'fill-slate-100 text-slate-300'
                }`}
              />
            </button>
          ))}
          <span className="text-xs font-bold text-slate-700 ml-1.5 w-6 text-right">
            {value}.0
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Review Submitted!</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Thank you for strengthening verified peer trust in Aditya University.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#5B4DFF]/10 text-[#5B4DFF] mb-2">
                <span>{isReviewingOwner ? 'Lender / Owner Evaluation' : 'Borrower / Renter Evaluation'}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Rate & Review {partnerName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                For rental: <strong className="text-slate-700">{itemTitle}</strong> ({bookingReference})
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Criteria Checklist */}
            <div className="space-y-2.5">
              {isReviewingOwner ? (
                <>
                  {renderStarSelector(
                    'Item Condition Accuracy',
                    'Accurate item description and fully functional condition',
                    conditionScore,
                    setConditionScore,
                    '70% Weight'
                  )}
                  {renderStarSelector(
                    'Communication',
                    'Responsiveness, clarity, and helpfulness',
                    communicationScore,
                    setCommunicationScore,
                    '15% Weight'
                  )}
                  {renderStarSelector(
                    'Punctuality & Handover',
                    'On-time meetup at designated campus spot',
                    punctualityScore,
                    setPunctualityScore,
                    '15% Weight'
                  )}
                </>
              ) : (
                <>
                  {renderStarSelector(
                    'On-Time Return',
                    'Returned punctually on the agreed schedule',
                    onTimeScore,
                    setOnTimeScore,
                    '60% Weight'
                  )}
                  {renderStarSelector(
                    'Item Care & Cleanliness',
                    'Maintained equipment in pristine, undamaged state',
                    itemCareScore,
                    setItemCareScore,
                    '40% Weight'
                  )}
                </>
              )}
            </div>

            {/* Calculated Preview Pill */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-[#F5A623] text-[#F5A623]" />
                <span className="text-xs font-bold text-amber-900">Normalized Review Score:</span>
              </div>
              <span className="text-base font-black text-amber-800">
                {calculatePreviewScore()} / 5.00
              </span>
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Feedback (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Share helpful notes about the handover, equipment condition, or peer communication..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] resize-none"
              />
              <div className="text-right text-[10px] text-slate-400 mt-0.5">
                {comment.length} / 500 characters
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#5B4DFF] hover:bg-[#4d3eff] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Verified Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

