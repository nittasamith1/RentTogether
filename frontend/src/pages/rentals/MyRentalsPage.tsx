import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  CheckCircle2,
  Clock,
  QrCode,
  RotateCcw,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Banknote,
  Trash2,
  Star,
} from 'lucide-react';
import {
  useMyRentals,
  useConfirmCashPayment,
  useCancelBooking,
  useInitiateReturn,
  useDeleteBookingRecord,
  useClearCancelledBookings,
} from '../../hooks/useBookings';
import { BookingSummary } from '../../services/bookingService';
import { HandoverPassModal } from '../../components/bookings/HandoverPassModal';
import { HandoverVerificationModal } from '../../components/bookings/HandoverVerificationModal';
import { LeaveReviewModal } from '../../components/common/LeaveReviewModal';

export const MyRentalsPage: React.FC = () => {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPassBooking, setSelectedPassBooking] = useState<BookingSummary | null>(null);
  const [selectedVerifyBooking, setSelectedVerifyBooking] = useState<BookingSummary | null>(null);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<BookingSummary | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const queryParams = {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  };

  const { data, isLoading, refetch } = useMyRentals(queryParams);
  const bookings = data?.results || [];

  const confirmCashMutation = useConfirmCashPayment();
  const cancelMutation = useCancelBooking();
  const returnMutation = useInitiateReturn();
  const deleteRecordMutation = useDeleteBookingRecord();
  const clearCancelledMutation = useClearCancelledBookings();

  // Counts
  const activeCount = bookings.filter((b) => b.status === 'ACTIVE').length;
  const pendingCount = bookings.filter((b) => b.status === 'PENDING_APPROVAL').length;
  const approvedPaymentCount = bookings.filter((b) => b.status === 'APPROVED_PENDING_PAYMENT').length;
  const confirmedHandoverCount = bookings.filter((b) => b.status === 'PAID_CONFIRMED').length;

  const handlePay = async (booking: BookingSummary) => {
    if (!confirm(`Confirm that you have handed over ₹${booking.total_amount} in offline cash to owner ${booking.owner_name}?`)) {
      return;
    }
    try {
      await confirmCashMutation.mutateAsync(booking.id);
      showToast('Cash payment confirmed! Waiting for owner cash receipt.');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to confirm cash payment.');
    }
  };

  const handleCancel = async (booking: BookingSummary) => {
    const reason = prompt('Please enter a cancellation reason:');
    if (reason === null) return;

    try {
      await cancelMutation.mutateAsync({ bookingId: booking.id, reason });
      showToast('Booking request cancelled.');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel booking.');
    }
  };

  const handleReturn = async (booking: BookingSummary) => {
    const notes = prompt('Any notes about return condition or pickup spot?');
    if (notes === null) return;

    try {
      await returnMutation.mutateAsync({ bookingId: booking.id, notes });
      showToast('Return initiated! Owner notified for inspection.');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to initiate return.');
    }
  };

  const getStatusBadge = (status: BookingSummary['status']) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return { label: 'Pending Owner Approval', bg: '#FFF2D6', color: '#A06312', border: '#F5DCB8' };
      case 'APPROVED_PENDING_PAYMENT':
        return { label: 'Approved · Cash Handover Required', bg: '#DFEDFF', color: '#3A6BB5', border: '#C5DCFA' };
      case 'PAID_CONFIRMED':
        return { label: 'Cash Confirmed · Ready for Pickup', bg: '#E9E3FF', color: '#7563D9', border: '#D8D0F5' };
      case 'ACTIVE':
        return { label: 'Active Rental', bg: '#DDF3E7', color: '#2D7A5B', border: '#B8E5CC' };
      case 'RETURNED_PENDING_INSPECTION':
        return { label: 'Returned · Inspection Pending', bg: '#FFE5D6', color: '#E8A447', border: '#F5CDB8' };
      case 'COMPLETED':
        return { label: 'Completed', bg: '#E9E3FF', color: '#7563D9', border: '#D8D0F5' };
      case 'REJECTED':
        return { label: 'Declined', bg: '#ECEEF2', color: '#85899B', border: '#EAE6E1' };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: '#ECEEF2', color: '#85899B', border: '#EAE6E1' };
      case 'DISPUTED':
        return { label: 'Disputed', bg: '#FEE2E2', color: '#E87575', border: '#FCA5A5' };
      default:
        return { label: status, bg: '#ECEEF2', color: '#85899B', border: '#EAE6E1' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none pt-4">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border"
            style={{ backgroundColor: '#303653', borderColor: '#7563D9', color: '#fff' }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#42A879' }} />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3"
        style={{ borderBottom: '1px solid #EAE6E1' }}
      >
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 border"
            style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Borrower Desk & Rental Pass</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: '#303653' }}>
            My Rentals
          </h1>
          <p className="text-xs mt-1" style={{ color: '#85899B' }}>
            Track items you are currently borrowing, access handover passes, and manage returns.
          </p>
        </div>

        <button
          onClick={() => navigate('/marketplace')}
          className="text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
          style={{ backgroundColor: '#7563D9', boxShadow: '0 4px 16px rgba(117, 99, 217, 0.25)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
        >
          <span>Find Equipment to Rent</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Rentals — Fresh Mint */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[#42A879] text-white">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#B8E5CC] text-[#2D7A5B]">
              In Hand
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Active Rentals</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#42A879' }}>
              {activeCount}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Currently in your possession</span>
          </div>
        </div>

        {/* Card 2: Ready for Handover — Soft Lavender */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[#7563D9] text-white">
              <QrCode className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D8D0F5] text-[#7563D9]">
              Pickup Ready
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Ready for Pickup</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#303653' }}>
              {confirmedHandoverCount}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Paid & pass code generated</span>
          </div>
        </div>

        {/* Card 3: Action Required (Cash Handover) — Sky Blue */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[#6398D6] text-white">
              <Banknote className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#C5DCFA] text-[#3A6BB5]">
              Pay Within 12h
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Cash Handover Due</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#6398D6' }}>
              {approvedPaymentCount}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Approved by equipment owner</span>
          </div>
        </div>

        {/* Card 4: Awaiting Owner Approval — Soft Peach */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[#E8A447] text-white">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F5CDB8] text-[#A06312]">
              24h Window
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Pending Approval</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#E8A447' }}>
              {pendingCount}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Awaiting owner confirmation</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div
        className="rounded-2xl p-4 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#303653' }}>
            Rental Status
          </span>
          <span className="text-[11px] font-medium" style={{ color: '#85899B' }}>
            ({bookings.length} {bookings.length === 1 ? 'rental' : 'rentals'})
          </span>

          {bookings.some((b) => b.status === 'CANCELLED' || b.status === 'REJECTED') && (
            <button
              type="button"
              onClick={async () => {
                if (confirm('Permanently purge cancelled and declined rental records from the database to reclaim storage?')) {
                  try {
                    const res = await clearCancelledMutation.mutateAsync();
                    showToast(res.detail || 'Cancelled history purged from database.');
                    refetch();
                  } catch {
                    alert('Failed to clear cancelled bookings.');
                  }
                }
              }}
              disabled={clearCancelledMutation.isPending}
              className="text-[11px] font-bold text-[#E87575] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              title="Reclaim database storage by deleting dead cancelled records"
            >
              <Trash2 className="w-3 h-3" />
              <span>Purge Cancelled History</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div
          className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl text-xs font-bold border"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'PAID_CONFIRMED', label: 'Ready to Pickup' },
            { id: 'APPROVED_PENDING_PAYMENT', label: 'To Pay' },
            { id: 'PENDING_APPROVAL', label: 'Pending' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === tab.id ? 'bg-white shadow-xs font-bold text-[#7563D9]' : 'text-[#303653]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rentals List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-3xl p-6 border animate-pulse space-y-3 bg-[#FFFCF7] border-[#EAE6E1]">
              <div className="h-5 bg-[#EAE6E1] rounded-md w-1/3" />
              <div className="h-4 bg-[#EAE6E1] rounded-md w-2/3" />
              <div className="h-10 bg-[#E9E3FF] rounded-xl" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div
          className="rounded-3xl p-12 text-center border shadow-xs space-y-4 max-w-xl mx-auto my-6"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xs"
            style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
          >
            <Package className="w-8 h-8 stroke-[1.75]" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#303653' }}>
              No rentals found
            </h3>
            <p className="text-xs mt-1 text-[#85899B]">
              You haven't requested or borrowed equipment matching this filter. Explore the campus marketplace to find calculators, lab tools, cameras, and textbooks.
            </p>
          </div>
          <button
            onClick={() => navigate('/marketplace')}
            className="text-white px-6 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-95"
            style={{ backgroundColor: '#7563D9' }}
          >
            <span>Explore Campus Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bookings.map((booking) => {
            const badge = getStatusBadge(booking.status);

            return (
              <div
                key={booking.id}
                className="rounded-3xl border p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:shadow-card-hover"
                style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
              >
                {/* Top: Item Title, Thumbnail & Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {booking.item_thumbnail ? (
                      <img
                        src={booking.item_thumbnail}
                        alt=""
                        className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#EAE6E1]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#E9E3FF] text-[#7563D9] font-black flex items-center justify-center shrink-0">
                        RT
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#85899B]">{booking.booking_code}</span>
                      </div>
                      <h3 className="font-extrabold text-base line-clamp-1 mt-0.5 text-[#303653]">
                        {booking.item_title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#85899B] mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#42A879]" />
                        <span>Owner: {booking.owner_name}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 border"
                    style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Rental Details Grid */}
                <div
                  className="rounded-2xl p-3 border text-xs grid grid-cols-2 gap-2"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  <div>
                    <span className="text-[#85899B] block text-[11px]">Rental Window</span>
                    <strong className="text-[#303653] font-bold">
                      {booking.start_date} → {booking.end_date}
                    </strong>
                    <span className="text-[10px] text-[#85899B] block">({booking.total_days} days)</span>
                  </div>

                  <div>
                    <span className="text-[#85899B] block text-[11px]">Rental Amount</span>
                    <strong className="text-[#7563D9] font-black text-sm">₹{booking.total_amount}</strong>
                    <span className="text-[10px] text-[#42A879] block">(In-Person Cash · ₹0 Deposit)</span>
                  </div>

                  <div className="col-span-2 pt-1 border-t border-[#EAE6E1] flex items-center gap-1 text-[11px] text-[#85899B]">
                    <MapPin className="w-3.5 h-3.5 text-[#7563D9] shrink-0" />
                    <span>Handover Spot: {booking.pickup_spot || 'Campus Handover Point'}</span>
                  </div>
                </div>

                {/* Contextual Action Buttons */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  {booking.status === 'APPROVED_PENDING_PAYMENT' && (
                    <>
                      {booking.renter_cash_confirmed ? (
                        <div className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[#E9E3FF] text-[#7563D9] border border-[#D8D0F5] flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#7563D9]" />
                          <span>Marked Cash Paid · Waiting for owner confirmation</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePay(booking)}
                          disabled={confirmCashMutation.isPending}
                          className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#42A879] hover:bg-[#358761] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Banknote className="w-4 h-4" />
                          <span>I Have Paid Cash (₹{booking.total_amount})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCancel(booking)}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {booking.status === 'PAID_CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => setSelectedVerifyBooking(booking)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#7563D9] hover:bg-[#6552C5] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm Pickup Receipt (Scan / Code)</span>
                    </button>
                  )}

                  {booking.status === 'ACTIVE' && (
                    <div className="flex gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setSelectedPassBooking(booking)}
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-[#7563D9] bg-[#E9E3FF] hover:bg-[#D8D0F5] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#D8D0F5]"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Display Return Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReturn(booking)}
                        disabled={returnMutation.isPending}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#42A879] hover:bg-[#358761] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Return Handback</span>
                      </button>
                    </div>
                  )}

                  {booking.status === 'PENDING_APPROVAL' && (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#A06312] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Owner has 24h to accept
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancel(booking)}
                        className="py-1.5 px-3 rounded-xl text-xs font-bold border border-[#EAE6E1] text-[#85899B] hover:text-[#DC2626] hover:border-[#FCA5A5] transition-colors cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}

                  {booking.status === 'COMPLETED' && (
                    <div className="w-full space-y-2">
                      <div className="w-full py-2 px-3 text-xs font-bold text-[#42A879] bg-[#DDF3E7] rounded-xl flex items-center justify-between border border-[#B8E5CC]">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Rental Completed · Full Deposit Refunded</span>
                        </div>
                      </div>

                      {/* Review & Feedback Writing Option for Customer */}
                      <div className="flex items-center justify-between pt-1">
                        {booking.has_reviewed ? (
                          <div className="text-[11px] font-bold text-[#42A879] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DDF3E7]/60 border border-[#B8E5CC]">
                            <Star className="w-3.5 h-3.5 fill-[#42A879] text-[#42A879]" />
                            <span>Feedback Submitted · Thank you!</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedReviewBooking(booking)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 hover:opacity-95"
                            style={{ backgroundColor: '#7563D9' }}
                            title="Write a review and feedback for the equipment owner"
                          >
                            <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                            <span>Write Review & Feedback</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {(booking.status === 'CANCELLED' || booking.status === 'REJECTED') && (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#E87575] font-semibold">
                        {booking.status === 'CANCELLED' ? 'Rental Cancelled' : 'Request Declined'}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Permanently delete booking ${booking.booking_reference} from database history?`)) {
                            try {
                              await deleteRecordMutation.mutateAsync(booking.id);
                              showToast('Record cleared from database history.');
                              refetch();
                            } catch {
                              alert('Failed to delete booking record.');
                            }
                          }
                        }}
                        disabled={deleteRecordMutation.isPending}
                        className="py-1 px-2.5 rounded-lg text-xs font-bold border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer flex items-center gap-1"
                        title="Delete this record from history and free DB storage"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear Record</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Handover Pass Modal (Displays Return Pass to Owner) */}
      <HandoverPassModal
        booking={selectedPassBooking}
        onClose={() => setSelectedPassBooking(null)}
      />

      {/* Handover Verification Modal (Renter confirms physical receipt on Pickup) */}
      <HandoverVerificationModal
        booking={selectedVerifyBooking}
        stage="PICKUP"
        onClose={() => setSelectedVerifyBooking(null)}
        onSuccess={() => {
          showToast('Pickup verified! Rental is now active.');
          refetch();
        }}
      />

      {/* Review Feedback Modal for Customer/Renter */}
      {selectedReviewBooking && (
        <LeaveReviewModal
          isOpen={Boolean(selectedReviewBooking)}
          onClose={() => setSelectedReviewBooking(null)}
          bookingId={selectedReviewBooking.id}
          bookingReference={selectedReviewBooking.booking_reference}
          itemTitle={selectedReviewBooking.item_title}
          partnerName={selectedReviewBooking.owner_name}
          defaultReviewType="OWNER"
          onReviewSubmitted={() => {
            showToast('Review submitted! Thank you for rating the owner.');
            refetch();
          }}
        />
      )}
    </div>
  );
};
