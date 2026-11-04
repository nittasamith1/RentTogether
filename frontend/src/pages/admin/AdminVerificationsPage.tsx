import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';
import { authService } from '../../services/auth';
import { StudentVerification } from '../../types';

export const AdminVerificationsPage: React.FC = () => {
  const [verifications, setVerifications] = useState<StudentVerification[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Selected item for ID image inspection
  const [inspectItem, setInspectItem] = useState<StudentVerification | null>(null);

  // Reject modal state
  const [rejectingItem, setRejectingItem] = useState<StudentVerification | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('ID card photo is blurry or roll number is unreadable.');
  const [rejectSubmitting, setRejectSubmitting] = useState<boolean>(false);

  const fetchVerifications = async () => {
    try {
      const data = await authService.getAdminVerifications(activeTab);
      setVerifications(data);
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to fetch student verification queue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchVerifications();
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVerifications();
  };

  const handleApprove = async (item: StudentVerification) => {
    setActionError('');
    setActionSuccess('');
    try {
      await authService.approveVerification(item.id);
      setActionSuccess(`Approved ${item.student_name} (${item.roll_number}) successfully!`);
      fetchVerifications();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to approve application.');
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    setActionError('');
    setActionSuccess('');
    try {
      setRejectSubmitting(true);
      await authService.rejectVerification(rejectingItem.id, rejectReason);
      setActionSuccess(`Rejected application for ${rejectingItem.student_name}.`);
      setRejectingItem(null);
      fetchVerifications();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to reject application.');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const filtered = verifications.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.student_name?.toLowerCase().includes(q) ||
      v.user_email?.toLowerCase().includes(q) ||
      v.roll_number?.toLowerCase().includes(q) ||
      v.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Campus Administrator Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0E131F]">Student Identity Verifications</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Review submitted student ID cards and institutional credentials for VNRVJIET.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ×
          </button>
        </motion.div>
      )}

      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-red-700 hover:text-red-900 font-bold">
            ×
          </button>
        </motion.div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100/80 border border-neutral-200/60 w-full sm:w-auto">
          {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white text-[#0E131F] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, roll number, email..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 bg-white"
          />
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-[#F5A623] rounded-full animate-spin" />
          <span>Loading verification applications...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-neutral-100 p-8">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-700">No applications found</h3>
          <p className="text-xs text-neutral-400 mt-1">
            {activeTab === 'PENDING'
              ? 'All pending student identity verifications have been processed.'
              : 'No student records match this filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-neutral-100 shadow-card p-5 flex flex-col justify-between hover:shadow-card-hover transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#0E131F]">{item.student_name || 'Student'}</h3>
                    <p className="text-[11px] text-neutral-500 font-mono">{item.user_email}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.verification_status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.verification_status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.verification_status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-600 bg-neutral-50/70 p-3 rounded-xl border border-neutral-100 mb-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Roll Number:</span>
                    <span className="font-mono font-semibold text-neutral-800">{item.roll_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Department:</span>
                    <span className="font-medium text-neutral-800">{item.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Year of Study:</span>
                    <span className="font-medium text-neutral-800">{item.year_of_study} Year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Campus:</span>
                    <span className="font-medium text-neutral-800">{item.college_code}</span>
                  </div>
                </div>

                {item.rejection_reason && (
                  <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-100 text-[11px] text-red-700">
                    <span className="font-bold block">Rejection Note:</span>
                    {item.rejection_reason}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setInspectItem(item)}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect ID Card Photo</span>
                </button>

                {item.verification_status === 'PENDING' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(item)}
                      className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingItem(item)}
                      className="py-2 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs flex items-center justify-center gap-1 border border-red-200 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect ID Modal */}
      <AnimatePresence>
        {inspectItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0E131F]">
                    Student ID: {inspectItem.student_name}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Roll: {inspectItem.roll_number} • {inspectItem.department}
                  </p>
                </div>
                <button
                  onClick={() => setInspectItem(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold"
                >
                  ×
                </button>
              </div>

              <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900/5 mb-4 max-h-80 flex items-center justify-center">
                {inspectItem.id_card_image || inspectItem.id_card_url ? (
                  <img
                    src={
                      inspectItem.id_card_url ||
                      (inspectItem.id_card_image?.startsWith('http')
                        ? inspectItem.id_card_image
                        : `http://localhost:8000${inspectItem.id_card_image}`)
                    }
                    alt="Student ID Card"
                    className="max-h-80 w-auto object-contain"
                  />
                ) : (
                  <div className="py-16 text-center text-xs text-neutral-400">
                    No image file uploaded for this record.
                  </div>
                )}
              </div>

              {inspectItem.verification_status === 'PENDING' && (
                <div className="flex gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleApprove(inspectItem);
                      setInspectItem(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingItem(inspectItem);
                      setInspectItem(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Application</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-neutral-100"
            >
              <h3 className="text-base font-bold text-[#0E131F] mb-1">
                Reject Verification
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Please provide an actionable reason for{' '}
                <span className="font-semibold text-neutral-700">{rejectingItem.student_name}</span> to fix upon resubmission.
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-3">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingItem(null)}
                    className="flex-1 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rejectSubmitting}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                  >
                    {rejectSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
