import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Wrench,
  UserX,
  CheckCircle2,
  Calendar as CalendarIcon,
  Inbox,
  Clock,
  Check,
  QrCode,
  RotateCcw,
  Banknote,
  Star,
} from 'lucide-react';
import { useMyListings } from '../hooks/useListings';
import { useOwnerCalendar } from '../hooks/useAvailability';
import {
  useMyIncomingRequests,
  useAcceptBooking,
  useRejectBooking,
  useCompleteInspection,
  useConfirmCashPayment
} from '../hooks/useBookings';
import { OwnerAvailabilityCalendar } from '../components/availability/OwnerAvailabilityCalendar';
import { HandoverPassModal } from '../components/bookings/HandoverPassModal';
import { HandoverVerificationModal } from '../components/bookings/HandoverVerificationModal';
import { LeaveReviewModal } from '../components/common/LeaveReviewModal';
import { BookingSummary } from '../services/bookingService';

export const BookingsCalendarPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'REQUESTS' | 'ACTIVE_LENDINGS' | 'COMPLETED_LENDINGS'>('CALENDAR');
  const [selectedHandoverBooking, setSelectedHandoverBooking] = useState<BookingSummary | null>(null);
  const [selectedVerifyBooking, setSelectedVerifyBooking] = useState<BookingSummary | null>(null);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<BookingSummary | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: listingsData } = useMyListings();
  const { data: calendarData } = useOwnerCalendar();
  const { data: incomingData, refetch: refetchIncoming } = useMyIncomingRequests();

  const acceptMutation = useAcceptBooking();
  const rejectMutation = useRejectBooking();
  const inspectionMutation = useCompleteInspection();
  const confirmCashMutation = useConfirmCashPayment();

  const items = (listingsData?.results || []).map((it) => ({
    id: it.id,
    title: it.title,
  }));

  const blocks = calendarData?.results || [];
  const incomingBookings = incomingData?.results || [];

  const pendingRequests = incomingBookings.filter((b) => b.status === 'PENDING_APPROVAL');
  const activeLendings = incomingBookings.filter((b) =>
    ['APPROVED_PENDING_PAYMENT', 'PAID_CONFIRMED', 'ACTIVE', 'RETURNED_PENDING_INSPECTION'].includes(b.status)
  );
  const completedLendings = incomingBookings.filter((b) => b.status === 'COMPLETED');

  // Compute stats
  const bookedCount = blocks.filter((b) => b.reason === 'BOOKED').length;
  const personalCount = blocks.filter((b) => b.reason === 'OWNER_UNAVAILABLE').length;
  const maintenanceCount = blocks.filter((b) => b.reason === 'MAINTENANCE').length;

  const handleAccept = async (booking: BookingSummary) => {
    if (!confirm(`Accept rental request from ${booking.renter_name} for ${booking.item_title}?`)) {
      return;
    }
    try {
      await acceptMutation.mutateAsync(booking.id);
      showToast('Booking accepted! Reserved on calendar for 12 hours.');
      refetchIncoming();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to accept booking.');
    }
  };

  const handleReject = async (booking: BookingSummary) => {
    const reason = prompt('Optional reason for declining:');
    if (reason === null) return;

    try {
      await rejectMutation.mutateAsync({ bookingId: booking.id, reason });
      showToast('Booking request declined.');
      refetchIncoming();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to decline booking.');
    }
  };

  const handleInspection = async (booking: BookingSummary, passed: boolean) => {
    const promptMsg = passed
      ? 'Confirm equipment is undamaged to complete the rental return?'
      : 'Explain the damage or missing accessories to open a dispute:';

    let notes = '';
    if (!passed) {
      const input = prompt(promptMsg);
      if (input === null) return;
      notes = input;
    } else {
      if (!confirm(promptMsg)) return;
    }

    try {
      await inspectionMutation.mutateAsync({
        bookingId: booking.id,
        payload: { passed, notes },
      });
      showToast(passed ? 'Inspection approved! Rental completed.' : 'Dispute opened.');
      refetchIncoming();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to complete inspection.');
    }
  };

  const handleConfirmCash = async (booking: BookingSummary) => {
    if (!confirm(`Confirm that you have physically received ₹${booking.total_amount} in cash from renter ${booking.renter_name}?`)) {
      return;
    }
    try {
      await confirmCashMutation.mutateAsync(booking.id);
      showToast('Cash receipt confirmed! Ready for handover exchange.');
      refetchIncoming();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to confirm cash receipt.');
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Conflict-Free Booking Engine & Calendar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: '#303653' }}>
            Rental Bookings & Smart Calendar
          </h1>
          <p className="text-xs mt-1" style={{ color: '#85899B' }}>
            Review incoming student requests, manage equipment handovers, and coordinate conflict-free availability.
          </p>
        </div>

        {/* View Switcher Tabs (Scrollable on small mobile) */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-2xl border text-xs font-bold overflow-x-auto max-w-full scrollbar-none self-start sm:self-auto shrink-0"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'CALENDAR' ? 'bg-white shadow-xs font-bold text-[#7563D9]' : 'text-[#303653]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Smart Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'REQUESTS' ? 'bg-white shadow-xs font-bold text-[#7563D9]' : 'text-[#303653]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Incoming Requests</span>
            {pendingRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#E87575] text-white text-[10px] flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE_LENDINGS')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'ACTIVE_LENDINGS' ? 'bg-white shadow-xs font-bold text-[#7563D9]' : 'text-[#303653]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Lendings & Returns ({activeLendings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED_LENDINGS')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'COMPLETED_LENDINGS' ? 'bg-white shadow-xs font-bold text-[#7563D9]' : 'text-[#303653]'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Completed & Reviews ({completedLendings.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Requests — Soft Peach */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[#E8A447] text-white">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F5CDB8] text-[#A06312]">
              Action Req.
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Pending Approval</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#E8A447' }}>
              {pendingRequests.length}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>
              Requires response within 24h
            </span>
          </div>
        </div>

        {/* Card 2: Active Student Bookings — Soft Lavender */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[#7563D9] text-white">
              <Lock className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D8D0F5] text-[#7563D9]">
              Reserved
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Scheduled Bookings</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#303653' }}>
              {bookedCount}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>
              Dates occupied by peer rentals
            </span>
          </div>
        </div>

        {/* Card 3: Personal Unavailable Blocks — Soft Peach */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[#E87575] text-white">
              <UserX className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F5CDB8] text-[#A03838]">
              Personal
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Owner Blocked Dates</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#E87575' }}>
              {personalCount}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>
              Personal use & study prep
            </span>
          </div>
        </div>

        {/* Card 4: Under Maintenance — Warm Light Amber */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: '#FFF2D6', borderColor: '#F5DCB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[#E8A447] text-white">
              <Wrench className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F5DCB8] text-[#A06312]">
              Servicing
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Under Maintenance</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#E8A447' }}>
              {maintenanceCount}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>
              Maintenance & inspection
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'CALENDAR' && <OwnerAvailabilityCalendar items={items} />}

      {activeTab === 'REQUESTS' && (
        <div
          className="rounded-3xl border p-6 shadow-sm space-y-4"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="pb-2 border-b border-[#EAE6E1]">
            <h2 className="text-base font-extrabold text-[#303653]">
              Incoming Rental Requests ({pendingRequests.length})
            </h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#E9E3FF] text-[#7563D9] flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-[#303653]">All caught up!</h3>
              <p className="text-xs text-[#85899B]">You have no pending requests to approve right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  <div className="flex items-start gap-4">
                    {req.item_thumbnail ? (
                      <img src={req.item_thumbnail} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#E9E3FF] text-[#7563D9] font-black flex items-center justify-center shrink-0">
                        RT
                      </div>
                    )}
                    <div>
                      <span className="font-mono text-[11px] font-bold text-[#85899B]">{req.booking_code}</span>
                      <h4 className="font-extrabold text-base text-[#303653]">{req.item_title}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#85899B] mt-1">
                        <span>
                          Renter: <strong className="text-[#303653]">{req.renter_name}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Dates:{' '}
                          <strong className="text-[#303653]">
                            {req.start_date} → {req.end_date}
                          </strong>{' '}
                          ({req.total_days} days)
                        </span>
                        <span>·</span>
                        <span>
                          Expected Payout:{' '}
                          <strong className="text-[#42A879]">₹{req.total_rental_fee}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => handleReject(req)}
                      disabled={rejectMutation.isPending}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(req)}
                      disabled={acceptMutation.isPending}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#7563D9] hover:bg-[#6552C5] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{acceptMutation.isPending ? 'Accepting...' : 'Accept Request'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ACTIVE_LENDINGS' && (
        <div
          className="rounded-3xl border p-6 shadow-sm space-y-4"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="pb-2 border-b border-[#EAE6E1]">
            <h2 className="text-base font-extrabold text-[#303653]">
              Active Lendings & Return Desk ({activeLendings.length})
            </h2>
          </div>

          {activeLendings.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#E9E3FF] text-[#7563D9] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-[#303653]">No active gear out on rent</h3>
              <p className="text-xs text-[#85899B]">All your equipment is currently safely with you.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeLendings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  <div className="flex items-start gap-4">
                    {b.item_thumbnail ? (
                      <img src={b.item_thumbnail} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#E9E3FF] text-[#7563D9] font-black flex items-center justify-center shrink-0">
                        RT
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#85899B]">{b.booking_code}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor:
                              b.status === 'APPROVED_PENDING_PAYMENT'
                                ? '#DFEDFF'
                                : b.status === 'PAID_CONFIRMED'
                                ? '#E9E3FF'
                                : b.status === 'ACTIVE'
                                ? '#DDF3E7'
                                : '#FFE5D6',
                            color:
                              b.status === 'APPROVED_PENDING_PAYMENT'
                                ? '#3A6BB5'
                                : b.status === 'PAID_CONFIRMED'
                                ? '#7563D9'
                                : b.status === 'ACTIVE'
                                ? '#2D7A5B'
                                : '#E8A447',
                          }}
                        >
                          {b.status === 'APPROVED_PENDING_PAYMENT'
                            ? b.renter_cash_confirmed
                              ? 'Renter Paid · Cash Receipt Req'
                              : 'Awaiting In-Person Cash'
                            : b.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-[#303653] mt-0.5">{b.item_title}</h4>
                      <p className="text-xs text-[#85899B]">
                        Rented by <strong>{b.renter_name}</strong> · Return due <strong>{b.end_date}</strong> · Agreed Cash:{' '}
                        <strong>₹{b.total_amount}</strong> (₹0 Deposit)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    {b.status === 'APPROVED_PENDING_PAYMENT' && (
                      b.owner_cash_confirmed ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#7563D9] bg-[#E9E3FF] border border-[#D8D0F5]">
                          ✓ You Confirmed Cash · Waiting for Renter
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmCash(b)}
                          disabled={confirmCashMutation.isPending}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#42A879] hover:bg-[#358761] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Banknote className="w-4 h-4" />
                          <span>Confirm Cash Received (₹{b.total_amount})</span>
                        </button>
                      )
                    )}

                    {b.status === 'PAID_CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => setSelectedHandoverBooking(b)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7563D9] hover:bg-[#6552C5] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Display Pickup Pass (QR & Code)</span>
                      </button>
                    )}

                    {b.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => setSelectedVerifyBooking(b)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#42A879] hover:bg-[#358761] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Verify Return Handback</span>
                      </button>
                    )}

                    {b.status === 'RETURNED_PENDING_INSPECTION' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleInspection(b, false)}
                          className="px-3 py-2 rounded-xl text-xs font-bold border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                        >
                          Report Damage
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspection(b, true)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#42A879] hover:bg-[#358761] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete Rental (No Damage)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel 4: Completed Lendings & Feedback Option */}
      {activeTab === 'COMPLETED_LENDINGS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid #EAE6E1' }}>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#303653' }}>
                Completed Equipment Lendings & Peer Feedback
              </h3>
              <p className="text-xs" style={{ color: '#85899B' }}>
                Evaluate student borrowers, review equipment care, and build verified campus reputation.
              </p>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
            >
              {completedLendings.length} Completed
            </span>
          </div>

          {completedLendings.length === 0 ? (
            <div
              className="rounded-3xl p-12 text-center border shadow-xs space-y-3"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                style={{ backgroundColor: '#FFF8ED', color: '#85899B' }}
              >
                <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h4 className="text-sm font-bold" style={{ color: '#303653' }}>
                No completed lendings yet
              </h4>
              <p className="text-xs max-w-sm mx-auto" style={{ color: '#85899B' }}>
                Once you complete the post-return equipment inspection for active bookings, they will appear here so you can leave feedback for your student customers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedLendings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl p-4 border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
                >
                  <div className="flex items-center gap-3.5">
                    {b.item_thumbnail ? (
                      <img
                        src={b.item_thumbnail}
                        alt={b.item_title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border"
                        style={{ borderColor: '#EAE6E1' }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs"
                        style={{ backgroundColor: '#DDF3E7', color: '#42A879' }}
                      >
                        ✓
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: '#303653' }}>
                          {b.item_title}
                        </span>
                        <span className="font-mono text-[10px] text-[#85899B] bg-[#FFF8ED] px-2 py-0.5 rounded-md border border-[#EAE6E1]">
                          {b.booking_reference}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
                        Customer: <strong style={{ color: '#303653' }}>{b.renter_name}</strong> · Rental completed · Earned:{' '}
                        <strong style={{ color: '#42A879' }}>₹{b.total_amount}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {b.has_reviewed ? (
                      <span
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5"
                        style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
                      >
                        <Star className="w-3.5 h-3.5 fill-[#42A879]" />
                        <span>Renter Feedback Submitted</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedReviewBooking(b)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 hover:opacity-95"
                        style={{ backgroundColor: '#7563D9' }}
                        title="Write feedback and evaluate the customer"
                      >
                        <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                        <span>Rate Customer / Leave Feedback</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Handover Pass Display Modal (Owner shows Pickup Pass to Renter) */}
      <HandoverPassModal
        booking={selectedHandoverBooking}
        onClose={() => setSelectedHandoverBooking(null)}
      />

      {/* Return Handback Verification Modal (Owner scans or enters Renter's code) */}
      <HandoverVerificationModal
        booking={selectedVerifyBooking}
        stage="RETURN"
        onClose={() => setSelectedVerifyBooking(null)}
        onSuccess={() => {
          showToast('Return handback verified! Item is ready for condition inspection.');
          refetchIncoming();
        }}
      />

      {/* Review Feedback Modal for Owner reviewing Customer */}
      {selectedReviewBooking && (
        <LeaveReviewModal
          isOpen={Boolean(selectedReviewBooking)}
          onClose={() => setSelectedReviewBooking(null)}
          bookingId={selectedReviewBooking.id}
          bookingReference={selectedReviewBooking.booking_reference}
          itemTitle={selectedReviewBooking.item_title}
          partnerName={selectedReviewBooking.renter_name}
          defaultReviewType="RENTER"
          onReviewSubmitted={() => {
            showToast('Customer review submitted successfully!');
            refetchIncoming();
            setSelectedReviewBooking(null);
          }}
        />
      )}
    </div>
  );
};
