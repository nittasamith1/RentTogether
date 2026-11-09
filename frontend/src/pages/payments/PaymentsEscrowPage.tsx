import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Copy,
  RefreshCw,
  Search,
  Sparkles,
  Info,
  X,
  Check,
  Banknote,
  UserCheck,
  HandCoins,
} from 'lucide-react';
import { useMyRentals, useMyIncomingRequests, useConfirmCashPayment } from '../../hooks/useBookings';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { BookingSummary } from '../../services/bookingService';

interface UnifiedTransaction extends BookingSummary {
  transactionType: 'RENTAL_OUTGOING' | 'EARNINGS_INCOMING';
  cashStatus: 'CONFIRMED' | 'AWAITING_OWNER' | 'AWAITING_RENTER' | 'AWAITING_BOTH' | 'COMPLETED' | 'CANCELLED';
}

export const PaymentsEscrowPage: React.FC = () => {
  const { user } = useAuth();
  const dialog = useDialog();

  // Queries
  const { data: rentalsData, isLoading: loadingRentals, refetch: refetchRentals } = useMyRentals();
  const { data: incomingData, isLoading: loadingIncoming, refetch: refetchIncoming } = useMyIncomingRequests();

  // Mutation
  const confirmCashMutation = useConfirmCashPayment();

  // State
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<UnifiedTransaction | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<UnifiedTransaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Normalize transactions
  const transactions: UnifiedTransaction[] = useMemo(() => {
    const list: UnifiedTransaction[] = [];

    // Borrower / Renter transactions (Outgoing payments)
    if (rentalsData?.results) {
      rentalsData.results.forEach((b) => {
        let cashStatus: UnifiedTransaction['cashStatus'] = 'AWAITING_BOTH';
        if (b.status === 'COMPLETED') {
          cashStatus = 'COMPLETED';
        } else if (b.status === 'PAID_CONFIRMED' || b.status === 'ACTIVE' || b.status === 'RETURNED_PENDING_INSPECTION') {
          cashStatus = 'CONFIRMED';
        } else if (b.renter_cash_confirmed && !b.owner_cash_confirmed) {
          cashStatus = 'AWAITING_OWNER';
        } else if (!b.renter_cash_confirmed && b.owner_cash_confirmed) {
          cashStatus = 'AWAITING_RENTER';
        } else if (b.status === 'CANCELLED' || b.status === 'REJECTED') {
          cashStatus = 'CANCELLED';
        }

        list.push({
          ...b,
          transactionType: 'RENTAL_OUTGOING',
          cashStatus,
        });
      });
    }

    // Lender / Owner transactions (Incoming earnings)
    if (incomingData?.results) {
      incomingData.results.forEach((b) => {
        let cashStatus: UnifiedTransaction['cashStatus'] = 'AWAITING_BOTH';
        if (b.status === 'COMPLETED') {
          cashStatus = 'COMPLETED';
        } else if (b.status === 'PAID_CONFIRMED' || b.status === 'ACTIVE' || b.status === 'RETURNED_PENDING_INSPECTION') {
          cashStatus = 'CONFIRMED';
        } else if (b.renter_cash_confirmed && !b.owner_cash_confirmed) {
          cashStatus = 'AWAITING_OWNER';
        } else if (!b.renter_cash_confirmed && b.owner_cash_confirmed) {
          cashStatus = 'AWAITING_RENTER';
        } else if (b.status === 'CANCELLED' || b.status === 'REJECTED') {
          cashStatus = 'CANCELLED';
        }

        list.push({
          ...b,
          transactionType: 'EARNINGS_INCOMING',
          cashStatus,
        });
      });
    }

    // Deduplicate by ID and sort descending
    const seen = new Set<string>();
    const uniqueList: UnifiedTransaction[] = [];
    for (const item of list) {
      const key = `${item.id}-${item.transactionType}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(item);
      }
    }

    return uniqueList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [rentalsData, incomingData]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    let cashPaid = 0;
    let cashReceived = 0;
    let pendingConfirmationCount = 0;
    let totalVolume = 0;

    transactions.forEach((tx) => {
      const rentalFee = parseFloat(tx.total_rental_fee || '0');
      if (tx.transactionType === 'RENTAL_OUTGOING' && (tx.cashStatus === 'CONFIRMED' || tx.cashStatus === 'COMPLETED')) {
        cashPaid += rentalFee;
      }
      if (tx.transactionType === 'EARNINGS_INCOMING' && (tx.cashStatus === 'CONFIRMED' || tx.cashStatus === 'COMPLETED')) {
        cashReceived += rentalFee;
      }
      if (tx.cashStatus === 'AWAITING_BOTH' || tx.cashStatus === 'AWAITING_OWNER' || tx.cashStatus === 'AWAITING_RENTER') {
        pendingConfirmationCount += 1;
      }
      if (tx.status !== 'CANCELLED' && tx.status !== 'REJECTED') {
        totalVolume += rentalFee;
      }
    });

    return {
      cashPaid,
      cashReceived,
      pendingConfirmationCount,
      totalVolume,
    };
  }, [transactions]);

  // Filtered list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeTab === 'PENDING' && !['AWAITING_BOTH', 'AWAITING_OWNER', 'AWAITING_RENTER'].includes(tx.cashStatus)) return false;
      if (activeTab === 'CONFIRMED' && tx.cashStatus !== 'CONFIRMED') return false;
      if (activeTab === 'COMPLETED' && tx.cashStatus !== 'COMPLETED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = tx.booking_code.toLowerCase().includes(q);
        const matchesTitle = tx.item_title.toLowerCase().includes(q);
        const matchesOwner = tx.owner_name?.toLowerCase().includes(q);
        const matchesRenter = tx.renter_name?.toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle && !matchesOwner && !matchesRenter) return false;
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmCash = async (booking: UnifiedTransaction) => {
    try {
      await confirmCashMutation.mutateAsync(booking.id);
      setActionSuccess(true);
      setTimeout(() => {
        setActionSuccess(false);
        setConfirmingBooking(null);
        refetchRentals();
        refetchIncoming();
      }, 1200);
    } catch (err: any) {
      dialog.showToast(err?.response?.data?.detail || 'Failed to record cash confirmation.', 'error');
    }
  };

  const isLoading = loadingRentals || loadingIncoming;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: '#303653' }}>
              Campus Payments & Cash Ledger
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border"
              style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
            >
              <Banknote className="w-3.5 h-3.5 stroke-[2.5]" />
              In-Person Offline Cash
            </span>
          </div>
          <p className="text-xs font-medium mt-1" style={{ color: '#85899B' }}>
            Zero platform fees. Zero security deposits. Dual physical cash confirmation direct between students.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPolicyModal(true)}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all hover:bg-white active:scale-95 cursor-pointer shadow-xs"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
          >
            <Info className="w-4 h-4 text-[#7563D9]" />
            <span>Cash Policy</span>
          </button>

          <button
            onClick={() => {
              refetchRentals();
              refetchIncoming();
            }}
            disabled={isLoading}
            className="p-2.5 rounded-2xl border transition-all hover:bg-white active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 text-[#7563D9] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Summary Cards — Premium Pastel Palette */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cash Paid as Renter */}
        <div
          className="rounded-3xl p-5 border shadow-xs"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: '#7563D9' }}>
              Cash Spent as Borrower
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/70">
              <HandCoins className="w-4 h-4 text-[#7563D9]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black" style={{ color: '#303653' }}>
              ₹{stats.cashPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] font-medium mt-0.5 text-[#5B48B8]">
              Confirmed cash handed to owners
            </p>
          </div>
        </div>

        {/* Card 2: Cash Received as Owner */}
        <div
          className="rounded-3xl p-5 border shadow-xs"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: '#2D7A5B' }}>
              Cash Received as Owner
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/70">
              <Banknote className="w-4 h-4 text-[#42A879]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black" style={{ color: '#303653' }}>
              ₹{stats.cashReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] font-medium mt-0.5 text-[#2D7A5B]">
              100% earnings direct in hand
            </p>
          </div>
        </div>

        {/* Card 3: Awaiting Confirmations */}
        <div
          className="rounded-3xl p-5 border shadow-xs"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: '#C45C20' }}>
              Awaiting Cash Confirmations
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/70">
              <Clock className="w-4 h-4 text-[#E8A447]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black" style={{ color: '#303653' }}>
              {stats.pendingConfirmationCount}
            </div>
            <p className="text-[11px] font-medium mt-0.5 text-[#C45C20]">
              Pending renter or owner cash clicks
            </p>
          </div>
        </div>

        {/* Card 4: Zero Fees Saved */}
        <div
          className="rounded-3xl p-5 border shadow-xs"
          style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: '#3A6BB0' }}>
              Platform Fees
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/70">
              <Sparkles className="w-4 h-4 text-[#6398D6]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black" style={{ color: '#303653' }}>
              ₹0.00
            </div>
            <p className="text-[11px] font-medium mt-0.5 text-[#3A6BB0]">
              Free for verified campus students
            </p>
          </div>
        </div>
      </div>

      {/* 3. V1 Offline Cash Guarantee Banner */}
      <div
        className="p-4 rounded-3xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
          >
            <UserCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs font-black" style={{ color: '#303653' }}>
              RentTogether V1 Dual-Confirmation Cash Policy
            </h3>
            <p className="text-[11px] font-medium" style={{ color: '#85899B' }}>
              Renter pays physical cash directly to owner at handover. Both confirm on their devices to unlock the QR Pickup Pass.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold shrink-0" style={{ color: '#42A879' }}>
          <CheckCircle2 className="w-4 h-4 text-[#42A879]" />
          <span>No gateway cut · 100% Peer-to-Peer</span>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div
          className="p-1 rounded-2xl border flex items-center gap-1 shadow-2xs"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          {[
            { id: 'ALL', label: `All (${transactions.length})` },
            { id: 'PENDING', label: `Pending (${stats.pendingConfirmationCount})` },
            { id: 'CONFIRMED', label: 'Confirmed' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id ? 'shadow-xs' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? '#7563D9' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#85899B',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#85899B]" />
          <input
            type="text"
            placeholder="Search by code, item, or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchQuery('');
            }}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#7563D9]"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-[#85899B] hover:text-[#303653] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Transactions Table */}
      <div
        className="rounded-3xl border shadow-xs overflow-hidden"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b text-[11px] font-bold uppercase tracking-wider" style={{ borderColor: '#EAE6E1', color: '#85899B' }}>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Equipment & Dates</th>
                <th className="py-3 px-4">Counterpart</th>
                <th className="py-3 px-4">Method & Amount</th>
                <th className="py-3 px-4">Dual Cash Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#EAE6E1' }}>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#85899B]">
                    <div className="w-6 h-6 border-2 border-[#7563D9] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Syncing campus cash ledger...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#85899B]">
                    No transactions found in this view.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isRenter = tx.renter_id === user?.id;
                  const isOwner = tx.owner_id === user?.id;
                  const canRenterConfirm = isRenter && !tx.renter_cash_confirmed && (tx.status === 'APPROVED_PENDING_PAYMENT');
                  const canOwnerConfirm = isOwner && !tx.owner_cash_confirmed && (tx.status === 'APPROVED_PENDING_PAYMENT');

                  return (
                    <tr key={`${tx.id}-${tx.transactionType}`} className="hover:bg-black/2 transition-colors">
                      {/* Booking Ref */}
                      <td className="py-3.5 px-4 font-bold" style={{ color: '#303653' }}>
                        <div className="flex items-center gap-1.5">
                          <span>{tx.booking_code}</span>
                          <button
                            onClick={() => handleCopy(tx.booking_code, tx.id)}
                            className="text-[#85899B] hover:text-[#7563D9] cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedId === tx.id ? <Check className="w-3.5 h-3.5 text-[#42A879]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="text-[10px] font-normal block text-[#85899B]">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Equipment */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold truncate max-w-[200px]" style={{ color: '#303653' }}>
                          {tx.item_title}
                        </div>
                        <span className="text-[10px] text-[#85899B]">
                          {tx.total_days} day(s) • {tx.start_date} to {tx.end_date}
                        </span>
                      </td>

                      {/* Counterpart */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold block" style={{ color: '#303653' }}>
                          {isRenter ? tx.owner_name : tx.renter_name}
                        </span>
                        <span className="text-[10px] text-[#85899B]">
                          {isRenter ? 'Owner (Lender)' : 'Renter (Borrower)'}
                        </span>
                      </td>

                      {/* Method & Amount */}
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-black" style={{ color: '#303653' }}>
                          ₹{parseFloat(tx.total_rental_fee || tx.total_amount || '0').toFixed(2)}
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block mt-0.5"
                          style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#7563D9' }}
                        >
                          Offline Cash
                        </span>
                      </td>

                      {/* Dual Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="font-medium text-[#85899B]">Renter Paid:</span>
                            {tx.renter_cash_confirmed ? (
                              <span className="font-bold text-[#42A879] flex items-center gap-0.5">
                                <Check className="w-3 h-3 stroke-[3]" /> Confirmed
                              </span>
                            ) : (
                              <span className="text-[#E8A447] font-semibold">Pending</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="font-medium text-[#85899B]">Owner Received:</span>
                            {tx.owner_cash_confirmed ? (
                              <span className="font-bold text-[#42A879] flex items-center gap-0.5">
                                <Check className="w-3 h-3 stroke-[3]" /> Received
                              </span>
                            ) : (
                              <span className="text-[#E8A447] font-semibold">Pending</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canRenterConfirm && (
                            <button
                              onClick={() => setConfirmingBooking(tx)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                              style={{ backgroundColor: '#7563D9' }}
                            >
                              I Have Paid
                            </button>
                          )}
                          {canOwnerConfirm && (
                            <button
                              onClick={() => setConfirmingBooking(tx)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                              style={{ backgroundColor: '#42A879' }}
                            >
                              Cash Received
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedReceipt(tx)}
                            className="p-1.5 rounded-xl border hover:bg-white text-[#85899B] hover:text-[#7563D9] cursor-pointer"
                            title="View Cash Receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: In-Person Cash Confirmation Dialog */}
      {confirmingBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl border space-y-4"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-[#E9E3FF] text-[#7563D9]">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black" style={{ color: '#303653' }}>
                    Confirm Physical Cash Handover
                  </h3>
                  <p className="text-[11px] text-[#85899B]">{confirmingBooking.booking_code}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmingBooking(null)}
                className="p-1 rounded-xl hover:bg-black/5 text-[#85899B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="p-3.5 rounded-2xl border text-xs space-y-2"
              style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
            >
              <div className="flex justify-between">
                <span className="text-[#85899B]">Equipment:</span>
                <span className="font-bold text-[#303653]">{confirmingBooking.item_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#85899B]">Duration:</span>
                <span className="font-bold text-[#303653]">{confirmingBooking.total_days} day(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#85899B]">Payment Method:</span>
                <span className="font-bold text-[#7563D9]">In-Person Offline Cash</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-black text-sm" style={{ borderColor: '#EAE6E1', color: '#303653' }}>
                <span>Exact Cash Amount:</span>
                <span className="text-base text-[#7563D9]">
                  ₹{parseFloat(confirmingBooking.total_rental_fee || confirmingBooking.total_amount || '0').toFixed(2)}
                </span>
              </div>
            </div>

            <div
              className="p-3 rounded-2xl border text-xs"
              style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC', color: '#2D7A5B' }}
            >
              {confirmingBooking.renter_id === user?.id ? (
                <span>
                  Confirm that you have handed exactly ₹{confirmingBooking.total_rental_fee} in cash directly to{' '}
                  <strong>{confirmingBooking.owner_name}</strong>.
                </span>
              ) : (
                <span>
                  Confirm that you have physically received exactly ₹{confirmingBooking.total_rental_fee} in cash from{' '}
                  <strong>{confirmingBooking.renter_name}</strong>.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmingBooking(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold border hover:bg-white cursor-pointer"
                style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#85899B' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmCash(confirmingBooking)}
                disabled={confirmCashMutation.isPending || actionSuccess}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: actionSuccess ? '#42A879' : '#7563D9' }}
              >
                {actionSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Recorded!</span>
                  </>
                ) : confirmCashMutation.isPending ? (
                  <span>Recording...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Cash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Official Cash Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl border space-y-4"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#EAE6E1' }}>
              <div>
                <h3 className="text-base font-black" style={{ color: '#303653' }}>
                  Official Campus Cash Voucher
                </h3>
                <p className="text-xs text-[#85899B]">Voucher #{selectedReceipt.booking_code}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-xl hover:bg-black/5 text-[#85899B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl border" style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}>
                <div>
                  <span className="text-[10px] text-[#85899B] uppercase font-bold block">Equipment</span>
                  <span className="font-bold text-[#303653]">{selectedReceipt.item_title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#85899B] uppercase font-bold block">Handover Desk</span>
                  <span className="font-bold text-[#303653]">{selectedReceipt.pickup_spot || 'Campus Center'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#85899B] uppercase font-bold block">Borrower (Renter)</span>
                  <span className="font-semibold text-[#303653]">{selectedReceipt.renter_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#85899B] uppercase font-bold block">Lender (Owner)</span>
                  <span className="font-semibold text-[#303653]">{selectedReceipt.owner_name}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl border space-y-1.5" style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}>
                <div className="flex justify-between">
                  <span className="text-[#85899B]">Payment Mechanism</span>
                  <span className="font-bold text-[#7563D9]">In-Person Offline Cash</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#85899B]">Rental Duration</span>
                  <span className="font-bold text-[#303653]">{selectedReceipt.total_days} day(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#85899B]">Security Deposit</span>
                  <span className="font-bold text-[#42A879]">₹0.00 (Zero Deposit Policy)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#85899B]">Campus Platform Fee</span>
                  <span className="font-bold text-[#42A879]">₹0.00 (Free for Students)</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-black text-sm" style={{ borderColor: '#EAE6E1' }}>
                  <span>Total Cash Paid:</span>
                  <span className="text-base text-[#7563D9]">
                    ₹{parseFloat(selectedReceipt.total_rental_fee || selectedReceipt.total_amount || '0').toFixed(2)}
                  </span>
                </div>
              </div>

              <div
                className="p-3 rounded-2xl border text-[11px] space-y-1"
                style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC', color: '#2D7A5B' }}
              >
                <div className="flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dual Confirmation Verification Audit</span>
                </div>
                <p>
                  Renter confirmation: {selectedReceipt.renter_cash_confirmed ? 'Verified' : 'Pending'} • Owner confirmation: {selectedReceipt.owner_cash_confirmed ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-white shadow-xs cursor-pointer"
                style={{ backgroundColor: '#7563D9' }}
              >
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Cash Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl border space-y-4"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#EAE6E1' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#7563D9]" />
                <h3 className="text-sm font-black" style={{ color: '#303653' }}>
                  RentTogether V1 Cash Policy
                </h3>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="p-1 rounded-xl text-[#85899B] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#303653]">
              <div className="p-3 rounded-2xl bg-[#FFF8ED] border border-[#EAE6E1]">
                <h4 className="font-bold text-[#7563D9] mb-1">1. Offline Physical Cash Only</h4>
                <p className="text-[#85899B] text-[11px]">
                  All rental fees are exchanged physically in cash during item handover. No online transaction fees or gateway deductions.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF8ED] border border-[#EAE6E1]">
                <h4 className="font-bold text-[#42A879] mb-1">2. Zero Security Deposits</h4>
                <p className="text-[#85899B] text-[11px]">
                  Campus trust is built through institutional student ID verification and peer accountability rather than locking up student money in deposits.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF8ED] border border-[#EAE6E1]">
                <h4 className="font-bold text-[#3A6BB0] mb-1">3. Dual Confirmation Protection</h4>
                <p className="text-[#85899B] text-[11px]">
                  Both students must confirm the exact amount on their own devices. The single-use QR Pickup Pass only activates once both parties agree.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="px-5 py-2 rounded-2xl text-xs font-bold text-white cursor-pointer"
                style={{ backgroundColor: '#7563D9' }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
