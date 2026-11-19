import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  Scale,
  Users,
  CheckCircle2,
  Eye,
  TrendingUp,
  DollarSign,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { useDialog } from '../../context/DialogContext';
import { DisputeItem, StudentVerificationItem } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const collegeName = user?.college_name || 'Campus';
  const dialog = useDialog();
  const {
    useAnalytics,
    useDisputes,
    usePendingVerifications,
    useFraudAlerts,
    resolveDispute,
    isResolvingDispute,
    verifyStudent,
    isVerifyingStudent,
    reviewFraudAlert,
  } = useAdmin();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'VERIFICATIONS' | 'DISPUTES' | 'FRAUD' | 'ANALYTICS'>('DISPUTES');

  // Query States
  const [verificationStatus, setVerificationStatus] = useState<string>('PENDING');
  const [disputeStatus, setDisputeStatus] = useState<string>('OPEN');

  // Data Queries
  const { data: analytics, isLoading: loadingAnalytics, refetch: refetchAnalytics } = useAnalytics();
  const { data: disputesData, isLoading: loadingDisputes, refetch: refetchDisputes } = useDisputes(disputeStatus);
  const { data: verificationsData, isLoading: loadingVerifications, refetch: refetchVerifications } = usePendingVerifications(verificationStatus);
  const { data: fraudAlerts, isLoading: loadingFraud, refetch: refetchFraud } = useFraudAlerts();

  // Inspect Modals
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<StudentVerificationItem | null>(null);

  // Dispute Arbitration Modal State
  const [arbitrationDecision, setArbitrationDecision] = useState<'FULL_REFUND_RENTER' | 'FORFEIT_DEPOSIT_TO_OWNER' | 'SPLIT'>('FULL_REFUND_RENTER');
  const [arbitrationNotes, setArbitrationNotes] = useState<string>('');
  const [isArbitrating, setIsArbitrating] = useState<boolean>(false);

  const disputesList = disputesData?.results || [];
  const verificationsList = verificationsData || [];
  const pendingCount = analytics?.users?.pending_verifications ?? verificationsList.length;
  const openDisputesCount = analytics?.safety_and_disputes?.open_disputes ?? disputesList.length;

  const handleExecuteArbitration = async () => {
    if (!selectedDispute) return;
    if (!arbitrationNotes.trim()) {
      dialog.showToast('Please provide administrative findings/notes for the official record.', 'warning');
      return;
    }

    try {
      setIsArbitrating(true);
      await resolveDispute({
        id: selectedDispute.id,
        decision: arbitrationDecision,
        notes: arbitrationNotes.trim(),
      });
      dialog.showToast('Dispute adjudicated successfully. Both parties notified.', 'success');
      setSelectedDispute(null);
      setArbitrationNotes('');
      refetchDisputes();
      refetchAnalytics();
    } catch (err: any) {
      dialog.showToast(err.response?.data?.error || 'Failed to adjudicate dispute.', 'error');
    } finally {
      setIsArbitrating(false);
    }
  };

  const handleVerifyStudentAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'APPROVE') {
      const confirmed = await dialog.confirm({
        title: 'Approve Student Identity',
        message: 'Are you sure you want to approve this student? They will receive full verified access to campus listings and bookings.',
        confirmText: 'Approve Student',
        variant: 'success',
      });
      if (!confirmed) return;

      try {
        await verifyStudent({ id, action: 'APPROVE' });
        dialog.showToast('Student verified successfully.', 'success');
        setSelectedVerification(null);
        refetchVerifications();
        refetchAnalytics();
      } catch (err: any) {
        dialog.showToast(err.response?.data?.error || 'Failed to approve student.', 'error');
      }
    } else {
      const reason = await dialog.prompt({
        title: 'Decline Student Verification',
        message: 'Provide a reason for declining this student registration (e.g. ID blurred, roll number mismatch):',
        placeholder: 'ID photo blurred or unreadable...',
        confirmText: 'Decline Application',
        variant: 'danger',
        required: true,
      });
      if (!reason) return;

      try {
        await verifyStudent({ id, action: 'REJECT', rejectionReason: reason });
        dialog.showToast('Student verification declined.', 'info');
        setSelectedVerification(null);
        refetchVerifications();
        refetchAnalytics();
      } catch (err: any) {
        dialog.showToast(err.response?.data?.error || 'Failed to reject student.', 'error');
      }
    }
  };

  const handleFraudReview = async (id: string, status: 'DISMISSED' | 'ACTION_TAKEN') => {
    const actionLabel = status === 'DISMISSED' ? 'Dismiss Alert (Approve Listing)' : 'Quarantine / Take Action';
    const notes = await dialog.prompt({
      title: `${actionLabel}`,
      message: `Enter administrator audit notes for fraud incident #${id.slice(0, 8)}:`,
      placeholder: status === 'DISMISSED' ? 'Verified price is authentic student equipment.' : 'High-risk pricing confirmed abnormal.',
      confirmText: 'Submit Audit',
      variant: status === 'DISMISSED' ? 'brand' : 'danger',
      required: true,
    });
    if (!notes) return;

    try {
      await reviewFraudAlert({ id, status, notes });
      dialog.showToast('Fraud alert updated.', 'success');
      refetchFraud();
      refetchAnalytics();
    } catch (err: any) {
      dialog.showToast(err.response?.data?.error || 'Failed to update alert.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 select-none pt-2">
      {/* 1. Header with Badge & Live Indicators */}
      <div
        className="rounded-3xl p-6 border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs"
            style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
          >
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black" style={{ color: '#303653' }}>
                Campus Administration Portal
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white"
                style={{ backgroundColor: '#7563D9' }}
              >
                {collegeName} Admin
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
              On-ground student ID verification, automated dispute arbitration, and anomaly monitoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchAnalytics();
              refetchDisputes();
              refetchVerifications();
              refetchFraud();
              dialog.showToast('Live dashboard data refreshed.', 'info');
            }}
            className="px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-white hover:bg-neutral-50 shadow-xs"
            style={{ borderColor: '#EAE6E1', color: '#303653' }}
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#7563D9]" />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* 2. Top Live Campus KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Verified Students */}
        <div
          onClick={() => setActiveTab('VERIFICATIONS')}
          className="rounded-3xl p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#7563D9]">
              <Users className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F28B82] text-white animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold text-[#7563D9]">Student Community</div>
            <div className="text-2xl font-black mt-0.5 text-[#303653]">
              {loadingAnalytics ? '...' : `${analytics?.users?.verified_students ?? 0} / ${analytics?.users?.total_students ?? 0}`}
            </div>
            <div className="text-[11px] font-medium mt-1 text-[#5B48B8]">
              {analytics?.users?.verification_rate_pct ?? 100}% ID verification rate
            </div>
          </div>
        </div>

        {/* Card 2: Open Disputes */}
        <div
          onClick={() => setActiveTab('DISPUTES')}
          className="rounded-3xl p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#FFF0F0', borderColor: '#FCA5A5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#E87575]">
              <Scale className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white ${
                openDisputesCount > 0 ? 'bg-[#E87575]' : 'bg-[#42A879]'
              }`}
            >
              {openDisputesCount} Open
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold text-[#E87575]">Dispute Mediation</div>
            <div className="text-2xl font-black mt-0.5 text-[#303653]">
              {loadingAnalytics ? '...' : openDisputesCount}
            </div>
            <div className="text-[11px] font-medium mt-1 text-[#D96060]">
              {analytics?.safety_and_disputes?.dispute_rate_pct ?? 0.0}% dispute rate
            </div>
          </div>
        </div>

        {/* Card 3: Rental Volume & GMV */}
        <div
          onClick={() => setActiveTab('ANALYTICS')}
          className="rounded-3xl p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#6398D6]">
              <DollarSign className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            <span className="text-xs font-bold text-[#3A6BB5]">Live GMV</span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold text-[#3A6BB5]">Campus Transaction Volume</div>
            <div className="text-2xl font-black mt-0.5 text-[#303653]">
              ₹{loadingAnalytics ? '...' : (analytics?.financials?.gross_merchandise_volume_inr ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-medium mt-1 text-[#3A6BB5]">
              {analytics?.marketplace?.total_bookings ?? 0} total bookings executed
            </div>
          </div>
        </div>

        {/* Card 4: AI Anomaly Alerts */}
        <div
          onClick={() => setActiveTab('FRAUD')}
          className="rounded-3xl p-5 border shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between cursor-pointer"
          style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#E8A447]">
              <AlertTriangle className="w-4 h-4 stroke-[2.5] text-white" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E8A447] text-white">
              Isolation Forest
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold text-[#C45C20]">AI Fraud Radar</div>
            <div className="text-2xl font-black mt-0.5 text-[#303653]">
              {loadingFraud ? '...' : fraudAlerts?.length ?? 0}
            </div>
            <div className="text-[11px] font-medium mt-1 text-[#C45C20]">
              Quarantined anomaly items
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: '#EAE6E1' }}>
        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'DISPUTES'
              ? 'bg-[#7563D9] text-white shadow-sm'
              : 'bg-white text-[#85899B] hover:text-[#303653] border border-[#EAE6E1]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>On-Ground Disputes ({openDisputesCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFICATIONS')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'VERIFICATIONS'
              ? 'bg-[#7563D9] text-white shadow-sm'
              : 'bg-white text-[#85899B] hover:text-[#303653] border border-[#EAE6E1]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student ID Queue ({pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('FRAUD')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'FRAUD'
              ? 'bg-[#7563D9] text-white shadow-sm'
              : 'bg-white text-[#85899B] hover:text-[#303653] border border-[#EAE6E1]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>AI Anomaly Flags ({fraudAlerts?.length ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ANALYTICS'
              ? 'bg-[#7563D9] text-white shadow-sm'
              : 'bg-white text-[#85899B] hover:text-[#303653] border border-[#EAE6E1]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Campus Analytics & Health</span>
        </button>
      </div>

      {/* 4. Tab Content: DISPUTES MEDIATION */}
      {activeTab === 'DISPUTES' && (
        <div
          className="rounded-3xl p-6 border shadow-xs space-y-4"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#303653]">
                Rental Dispute Mediation Queue
              </h2>
              <p className="text-xs text-[#85899B]">
                Arbitrate damaged equipment, overdue returns, and forfeit deposits or issue refunds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={disputeStatus}
                onChange={(e) => setDisputeStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-white text-[#303653]"
                style={{ borderColor: '#EAE6E1' }}
              >
                <option value="OPEN">Open (Requires Action)</option>
                <option value="RESOLVED">Resolved Disputes</option>
                <option value="ALL">All Disputes</option>
              </select>
            </div>
          </div>

          {loadingDisputes ? (
            <div className="p-12 text-center text-xs text-[#85899B]">Loading dispute records...</div>
          ) : disputesList.length === 0 ? (
            <div className="p-12 text-center space-y-2 bg-[#FFF8ED] rounded-2xl border border-[#EAE6E1]">
              <CheckCircle2 className="w-8 h-8 text-[#42A879] mx-auto" />
              <h4 className="text-sm font-bold text-[#303653]">No open disputes on campus</h4>
              <p className="text-xs text-[#85899B]">
                All peer handovers, inspections, and returns are proceeding cleanly.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[#85899B]" style={{ borderColor: '#EAE6E1' }}>
                    <th className="pb-3 font-bold">Booking / Resource</th>
                    <th className="pb-3 font-bold">Raised By vs Against</th>
                    <th className="pb-3 font-bold">Issue Type</th>
                    <th className="pb-3 font-bold">Claimed Amount</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Arbitration Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFEB]">
                  {disputesList.map((d) => (
                    <tr key={d.id} className="hover:bg-neutral-50/50 transition">
                      <td className="py-3.5 pr-3">
                        <div className="font-bold text-[#303653]">{d.item_title}</div>
                        <div className="text-[11px] font-mono text-[#7563D9]">{d.booking_code}</div>
                      </td>
                      <td className="py-3.5 pr-3">
                        <div className="font-semibold text-[#303653]">{d.raised_by_name}</div>
                        <div className="text-[11px] text-[#85899B]">vs {d.against_user_name}</div>
                      </td>
                      <td className="py-3.5 pr-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF0F0] text-[#E87575]">
                          {d.issue_type.replace(/_/g, ' ')}
                        </span>
                        <div className="text-[11px] text-[#85899B] line-clamp-1 mt-0.5 max-w-xs">
                          {d.description}
                        </div>
                      </td>
                      <td className="py-3.5 pr-3 font-black text-[#303653]">
                        ₹{parseFloat(d.claimed_compensation).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            d.status === 'RESOLVED'
                              ? 'bg-[#DDF3E7] text-[#42A879]'
                              : 'bg-[#FFF0F0] text-[#E87575]'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {d.status !== 'RESOLVED' ? (
                          <button
                            onClick={() => {
                              setSelectedDispute(d);
                              setArbitrationDecision('FULL_REFUND_RENTER');
                              setArbitrationNotes('');
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#7563D9] hover:bg-[#6552C5] shadow-xs cursor-pointer"
                          >
                            Arbitrate
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#42A879]">
                            {d.resolution_decision}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab Content: STUDENT ID VERIFICATION QUEUE */}
      {activeTab === 'VERIFICATIONS' && (
        <div
          className="rounded-3xl p-6 border shadow-xs space-y-4"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#303653]">
                Student ID Registration & Verification Queue
              </h2>
              <p className="text-xs text-[#85899B]">
                Verify institutional roll numbers and photo identity cards for college students.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-white text-[#303653]"
                style={{ borderColor: '#EAE6E1' }}
              >
                <option value="PENDING">Pending Review</option>
                <option value="VERIFIED">Verified Students</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All Applications</option>
              </select>
            </div>
          </div>

          {loadingVerifications ? (
            <div className="p-12 text-center text-xs text-[#85899B]">Loading student verification queue...</div>
          ) : verificationsList.length === 0 ? (
            <div className="p-12 text-center space-y-2 bg-[#FFF8ED] rounded-2xl border border-[#EAE6E1]">
              <CheckCircle2 className="w-8 h-8 text-[#42A879] mx-auto" />
              <h4 className="text-sm font-bold text-[#303653]">No pending student verifications</h4>
              <p className="text-xs text-[#85899B]">
                All registered campus students have been reviewed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {verificationsList.map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl p-4 border bg-white shadow-xs flex flex-col justify-between hover:border-[#7563D9] transition"
                  style={{ borderColor: '#EAE6E1' }}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black text-[#303653]">
                          {v.user.first_name} {v.user.last_name}
                        </h4>
                        <div className="text-[11px] text-[#85899B]">{v.user.email}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.verification_status === 'VERIFIED'
                            ? 'bg-[#DDF3E7] text-[#42A879]'
                            : v.verification_status === 'REJECTED'
                            ? 'bg-[#FFF0F0] text-[#E87575]'
                            : 'bg-[#FFF8ED] text-[#C45C20]'
                        }`}
                      >
                        {v.verification_status}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FFF8ED] border border-[#EAE6E1] space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#85899B]">Roll Number:</span>
                        <span className="font-mono font-bold text-[#303653]">{v.roll_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#85899B]">Department:</span>
                        <span className="font-semibold text-[#303653]">{v.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#85899B]">Year of Study:</span>
                        <span className="font-semibold text-[#303653]">Year {v.year_of_study}</span>
                      </div>
                    </div>

                    {/* ID Card Thumbnail */}
                    {v.id_card_url || v.id_card_image ? (
                      <div
                        onClick={() => setSelectedVerification(v)}
                        className="h-28 rounded-xl overflow-hidden border border-[#EAE6E1] relative cursor-pointer group bg-neutral-100 flex items-center justify-center"
                      >
                        <img
                          src={v.id_card_url || v.id_card_image}
                          alt="Student ID Card"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect ID</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 rounded-xl border border-dashed border-[#EAE6E1] flex items-center justify-center text-xs text-[#85899B]">
                        No ID photo uploaded
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAE6E1] flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyStudentAction(v.id, 'APPROVE')}
                      disabled={isVerifyingStudent}
                      className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white bg-[#42A879] hover:bg-[#368E66] shadow-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleVerifyStudentAction(v.id, 'REJECT')}
                      disabled={isVerifyingStudent}
                      className="flex-1 py-1.5 rounded-xl text-xs font-bold text-[#E87575] bg-[#FFF0F0] hover:bg-[#FEE2E2] border border-[#FCA5A5] cursor-pointer flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab Content: AI ANOMALY FLAGS */}
      {activeTab === 'FRAUD' && (
        <div
          className="rounded-3xl p-6 border shadow-xs space-y-4"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base font-bold text-[#303653]">
                AI Isolation Forest Fraud & Anomaly Detections
              </h2>
              <p className="text-xs text-[#85899B]">
                Listings automatically quarantined due to abnormal pricing, high creation velocity, or duplicate photo hashes.
              </p>
            </div>
          </div>

          {loadingFraud ? (
            <div className="p-12 text-center text-xs text-[#85899B]">Loading anomaly telemetry...</div>
          ) : fraudAlerts?.length === 0 ? (
            <div className="p-12 text-center space-y-2 bg-[#FFF8ED] rounded-2xl border border-[#EAE6E1]">
              <CheckCircle2 className="w-8 h-8 text-[#42A879] mx-auto" />
              <h4 className="text-sm font-bold text-[#303653]">Zero safety anomalies flagged</h4>
              <p className="text-xs text-[#85899B]">
                The Isolation Forest risk engine has detected zero price gouging or fake listings today.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fraudAlerts?.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-2xl border bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{ borderColor: alert.risk_tier === 'HIGH' ? '#FCA5A5' : '#EAE6E1' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        alert.risk_tier === 'HIGH'
                          ? 'bg-[#FFF0F0] text-[#E87575]'
                          : 'bg-[#FFF8ED] text-[#C45C20]'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#303653]">
                          {alert.item_title || 'Campus Equipment Item'}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alert.risk_tier === 'HIGH'
                              ? 'bg-[#E87575] text-white'
                              : 'bg-[#E8A447] text-white'
                          }`}
                        >
                          Risk Score: {alert.risk_score} / 100
                        </span>
                      </div>
                      <p className="text-xs text-[#85899B] mt-0.5">
                        Lender: {alert.user_email || 'Student'} • Status: {alert.status}
                      </p>
                      {alert.signals && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {Object.entries(alert.signals).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFF8ED] border border-[#EAE6E1] text-[#7563D9]"
                            >
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFraudReview(alert.id, 'DISMISSED')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#EAE6E1] text-[#303653] hover:bg-neutral-50 cursor-pointer"
                    >
                      Dismiss (Approve)
                    </button>
                    <button
                      onClick={() => handleFraudReview(alert.id, 'ACTION_TAKEN')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#E87575] hover:bg-[#D96060] cursor-pointer"
                    >
                      Confirm Quarantine
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Tab Content: PLATFORM HEALTH & ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div
          className="rounded-3xl p-6 border shadow-xs space-y-6"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div>
            <h2 className="text-base font-bold text-[#303653]">
              Campus Resource Sharing Metrics
            </h2>
            <p className="text-xs text-[#85899B]">
              Aggregate transactional statistics, circular economy participation, and escrow custody.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#EAE6E1] space-y-1">
              <span className="text-xs font-semibold text-[#85899B]">Gross Platform Volume</span>
              <div className="text-2xl font-black text-[#7563D9]">
                ₹{(analytics?.financials?.gross_merchandise_volume_inr ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-[#42A879]">Direct peer-to-peer student earnings</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EAE6E1] space-y-1">
              <span className="text-xs font-semibold text-[#85899B]">Escrow Deposits Held</span>
              <div className="text-2xl font-black text-[#42A879]">
                ₹{(analytics?.financials?.total_escrow_deposit_held_inr ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-[#42A879]">Zero-risk segregated college vault</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EAE6E1] space-y-1">
              <span className="text-xs font-semibold text-[#85899B]">Campus Commission (5%)</span>
              <div className="text-2xl font-black text-[#303653]">
                ₹{(analytics?.financials?.platform_commission_earned_inr ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-[#85899B]">Platform operations fund</p>
            </div>
          </div>

          {/* College Distribution Breakdown */}
          {analytics?.colleges && analytics.colleges.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#303653]">
                Participating Colleges & Campus Fleet
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.colleges.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#EAE6E1] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#303653]">{c.name}</div>
                      <div className="text-[11px] font-mono text-[#7563D9]">{c.code}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#E9E3FF] text-[#7563D9]">
                      {c.student_count} Students
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. Dispute Arbitration Modal */}
      <AnimatePresence>
        {selectedDispute && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDispute(null)}
              className="fixed inset-0 bg-[#1E2235]/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl border z-10 bg-white max-h-[90vh] overflow-y-auto space-y-4"
              style={{ borderColor: '#EAE6E1' }}
            >
              <div className="flex items-start justify-between pb-3 border-b border-[#EAE6E1]">
                <div>
                  <h3 className="text-base font-black text-[#303653]">
                    Arbitrate On-Ground Dispute
                  </h3>
                  <p className="text-xs text-[#85899B] font-mono">
                    Ref: #{selectedDispute.id.slice(0, 8)} • Booking {selectedDispute.booking_code}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Case Summary */}
              <div className="p-3.5 rounded-2xl bg-[#FFF8ED] border border-[#EAE6E1] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#85899B]">Resource:</span>
                  <span className="font-bold text-[#303653]">{selectedDispute.item_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#85899B]">Claimant:</span>
                  <span className="font-semibold text-[#303653]">{selectedDispute.raised_by_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#85899B]">Respondent:</span>
                  <span className="font-semibold text-[#303653]">{selectedDispute.against_user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#85899B]">Claimed Compensation:</span>
                  <span className="font-black text-[#E87575]">₹{selectedDispute.claimed_compensation}</span>
                </div>
                <div className="pt-1.5 text-[#303653] border-t border-[#EAE6E1]">
                  <span className="font-bold text-[11px] block text-[#85899B]">Incident Statement:</span>
                  <p className="mt-0.5 leading-relaxed">{selectedDispute.description}</p>
                </div>
              </div>

              {/* Evidence Images */}
              {selectedDispute.evidence_image_urls && selectedDispute.evidence_image_urls.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-[#303653] block mb-1.5">Submitted Photographic Evidence:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedDispute.evidence_image_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-20 h-20 rounded-xl overflow-hidden border border-[#EAE6E1] shrink-0 hover:opacity-90"
                      >
                        <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#303653] block">
                  Select Campus Arbitration Decision:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      arbitrationDecision === 'FULL_REFUND_RENTER'
                        ? 'border-[#7563D9] bg-[#E9E3FF]'
                        : 'border-[#EAE6E1] hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#303653]">Full Refund to Renter</div>
                      <div className="text-[11px] text-[#85899B]">
                        Item was unusable, wrong, or never provided. Cancels rental and returns deposit.
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="decision"
                      checked={arbitrationDecision === 'FULL_REFUND_RENTER'}
                      onChange={() => setArbitrationDecision('FULL_REFUND_RENTER')}
                      className="accent-[#7563D9]"
                    />
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      arbitrationDecision === 'FORFEIT_DEPOSIT_TO_OWNER'
                        ? 'border-[#7563D9] bg-[#E9E3FF]'
                        : 'border-[#EAE6E1] hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#303653]">Forfeit Deposit to Owner</div>
                      <div className="text-[11px] text-[#85899B]">
                        Physical damage or overdue loss confirmed. Claims deposit/compensation for lender.
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="decision"
                      checked={arbitrationDecision === 'FORFEIT_DEPOSIT_TO_OWNER'}
                      onChange={() => setArbitrationDecision('FORFEIT_DEPOSIT_TO_OWNER')}
                      className="accent-[#7563D9]"
                    />
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      arbitrationDecision === 'SPLIT'
                        ? 'border-[#7563D9] bg-[#E9E3FF]'
                        : 'border-[#EAE6E1] hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#303653]">Split Mutual Settlement</div>
                      <div className="text-[11px] text-[#85899B]">
                        Both parties bear partial responsibility; mediated closure.
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="decision"
                      checked={arbitrationDecision === 'SPLIT'}
                      onChange={() => setArbitrationDecision('SPLIT')}
                      className="accent-[#7563D9]"
                    />
                  </label>
                </div>
              </div>

              {/* Administrative Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#303653] block">
                  Official Administrative Findings & Notes:
                </label>
                <textarea
                  rows={3}
                  value={arbitrationNotes}
                  onChange={(e) => setArbitrationNotes(e.target.value)}
                  placeholder="Physical inspection verified equipment defect / handover verified..."
                  className="w-full p-2.5 rounded-xl border text-xs text-[#303653] focus:outline-none focus:border-[#7563D9]"
                  style={{ borderColor: '#EAE6E1' }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE6E1]">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#85899B] hover:text-[#303653]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteArbitration}
                  disabled={isArbitrating || isResolvingDispute}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#7563D9] hover:bg-[#6552C5] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isArbitrating ? 'Recording Resolution...' : 'Enforce Arbitration'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Student Verification Inspect Modal */}
      <AnimatePresence>
        {selectedVerification && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVerification(null)}
              className="fixed inset-0 bg-[#1E2235]/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl border z-10 bg-white space-y-4"
              style={{ borderColor: '#EAE6E1' }}
            >
              <div className="flex items-start justify-between pb-2 border-b border-[#EAE6E1]">
                <div>
                  <h3 className="text-base font-bold text-[#303653]">
                    {selectedVerification.user.first_name} {selectedVerification.user.last_name}
                  </h3>
                  <p className="text-xs text-[#85899B]">
                    Roll: {selectedVerification.roll_number} • {selectedVerification.department}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-[#EAE6E1] max-h-72 flex items-center justify-center bg-neutral-100">
                <img
                  src={selectedVerification.id_card_url || selectedVerification.id_card_image}
                  alt="Student ID"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE6E1]">
                <button
                  onClick={() => handleVerifyStudentAction(selectedVerification.id, 'REJECT')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#E87575] bg-[#FFF0F0] border border-[#FCA5A5]"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleVerifyStudentAction(selectedVerification.id, 'APPROVE')}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#42A879]"
                >
                  Approve Student
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
