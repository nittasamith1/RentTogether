import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';
import { StudentVerification } from '../../types';
import { Logo } from '../../components/common/Logo';

export const VerificationPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, updateUser } = useAuth();

  const emailParam = searchParams.get('email') || user?.email || '';

  const [verification, setVerification] = useState<StudentVerification | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Resubmission state (if REJECTED)
  const [showResubmitForm, setShowResubmitForm] = useState<boolean>(false);
  const [newIdCard, setNewIdCard] = useState<File | null>(null);
  const [newIdPreview, setNewIdPreview] = useState<string | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState<boolean>(false);
  const [resubmitError, setResubmitError] = useState<string>('');
  const [resubmitSuccess, setResubmitSuccess] = useState<string>('');

  const fetchStatus = async () => {
    try {
      const data = await authService.getVerificationStatus(emailParam);
      setVerification(data);
      if (data.verification_status === 'VERIFIED') {
        updateUser({ is_college_verified: true, verification_status: 'VERIFIED' });
      }
    } catch {
      // Keep existing data if network fails
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [emailParam]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setResubmitError('Please upload a valid image file (PNG/JPG).');
        return;
      }
      setNewIdCard(file);
      setResubmitError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewIdPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResubmitError('');
    setResubmitSuccess('');
    if (!newIdCard) {
      setResubmitError('Please select a clear photo of your student ID card.');
      return;
    }

    try {
      setResubmitLoading(true);
      const formData = new FormData();
      formData.append('id_card_image', newIdCard);
      const res = await authService.resubmitVerification(formData);
      setResubmitSuccess('Application resubmitted successfully! It is now pending review.');
      setVerification(res.verification);
      setShowResubmitForm(false);
      setNewIdCard(null);
      setNewIdPreview(null);
    } catch (err: any) {
      setResubmitError(err.response?.data?.detail || 'Resubmission failed. Please try again.');
    } finally {
      setResubmitLoading(false);
    }
  };

  const status = verification?.verification_status || user?.verification_status || 'PENDING';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans" style={{ backgroundColor: '#FFF8ED', color: '#303653' }}>
      {/* Soft Ambient Background Blooms */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(117,99,217,0.06)' }} />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(66,168,121,0.06)' }} />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Brand Header with Authentic Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link to="/" className="inline-block mb-3 hover:opacity-95 transition-opacity">
            <Logo size="lg" />
          </Link>
          <p className="text-xs font-medium" style={{ color: '#85899B' }}>Campus Identity &amp; Verification Status</p>
        </div>

        {/* Status Card */}
        <div className="rounded-3xl shadow-sm p-8" style={{ backgroundColor: '#FFFCF7', border: '1px solid #EAE6E1' }}>
          {status === 'VERIFIED' ? (
            /* VERIFIED STATE */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold" style={{ color: '#303653' }}>Identity Verified!</h2>
                <p className="text-xs mt-1" style={{ color: '#85899B' }}>
                  Your Aditya University campus membership has been approved by the campus administrator.
                </p>
              </div>

              <div className="p-4 rounded-2xl text-left text-xs space-y-2" style={{ backgroundColor: '#FFF8ED', border: '1px solid #EAE6E1' }}>
                <div className="flex justify-between">
                  <span style={{ color: '#85899B' }}>Student Name:</span>
                  <span className="font-bold" style={{ color: '#303653' }}>{verification?.student_name || user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#85899B' }}>Roll Number:</span>
                  <span className="font-mono font-bold" style={{ color: '#303653' }}>{verification?.roll_number}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#85899B' }}>Department:</span>
                  <span className="font-semibold" style={{ color: '#303653' }}>{verification?.department}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#85899B' }}>Institution:</span>
                  <span className="font-semibold" style={{ color: '#303653' }}>{verification?.college_name || 'Aditya University'}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: '#7563D9', boxShadow: '0 4px 16px rgba(117,99,217,0.30)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6552C5')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7563D9')}
              >
                <span>Enter Campus Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : status === 'REJECTED' ? (
            /* REJECTED STATE */
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mx-auto mb-3">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-extrabold" style={{ color: '#303653' }}>Verification Needs Attention</h2>
                <p className="text-xs mt-1" style={{ color: '#85899B' }}>
                  Your ID verification submission could not be approved by the administrator.
                </p>
              </div>

              {/* Rejection Reason Notice */}
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-xs">
                <span className="font-bold text-rose-800 block mb-1">Reason for Rejection:</span>
                <p className="text-rose-700 leading-relaxed">
                  {verification?.rejection_reason || 'Student ID card was illegible or did not match student details.'}
                </p>
              </div>

              {resubmitSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{resubmitSuccess}</span>
                </div>
              )}

              {/* Resubmit form */}
              {!showResubmitForm ? (
                <button
                  type="button"
                  onClick={() => setShowResubmitForm(true)}
                  className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: '#7563D9', boxShadow: '0 4px 16px rgba(117,99,217,0.30)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6552C5')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7563D9')}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Clearer ID Card &amp; Resubmit</span>
                </button>
              ) : (
                <form onSubmit={handleResubmit} className="space-y-4 pt-2" style={{ borderTop: '1px solid #EAE6E1' }}>
                  <h4 className="text-xs font-bold" style={{ color: '#303653' }}>Resubmit College ID Photo</h4>

                  {resubmitError && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                      {resubmitError}
                    </div>
                  )}

                  <div
                    className="rounded-2xl p-4 text-center transition-all"
                    style={{ border: '2px dashed #EAE6E1', backgroundColor: 'rgba(255,248,237,0.5)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#7563D9')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#EAE6E1')}
                  >
                    <input
                      type="file"
                      id="resubmit-id-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {newIdPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={newIdPreview}
                          alt="ID Preview"
                          className="w-40 h-24 object-cover rounded-xl mb-2 shadow-sm"
                          style={{ border: '1px solid #EAE6E1' }}
                        />
                        <label
                          htmlFor="resubmit-id-upload"
                          className="text-xs font-bold hover:underline cursor-pointer"
                          style={{ color: '#7563D9' }}
                        >
                          Change photo
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="resubmit-id-upload" className="cursor-pointer flex flex-col items-center">
                        <UploadCloud className="w-6 h-6 mb-1.5" style={{ color: '#7563D9' }} />
                        <span className="text-xs font-bold" style={{ color: '#303653' }}>Choose clear ID card image</span>
                        <span className="text-[10px] mt-0.5" style={{ color: '#85899B' }}>Ensure name and roll number are visible</span>
                      </label>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowResubmitForm(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                      style={{ border: '1px solid #EAE6E1', color: '#303653', backgroundColor: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF8ED')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resubmitLoading || !newIdCard}
                      className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all"
                      style={{ backgroundColor: '#7563D9' }}
                      onMouseEnter={e => !(resubmitLoading || !newIdCard) && (e.currentTarget.style.backgroundColor = '#6552C5')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7563D9')}
                    >
                      {resubmitLoading ? 'Submitting...' : 'Submit for Re-Review'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* PENDING STATE */
            <div className="space-y-6">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <div className="absolute inset-0 rounded-2xl animate-ping opacity-40" style={{ backgroundColor: '#E9E3FF' }} />
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E9E3FF', border: '1px solid #D8D0F5', color: '#7563D9' }}>
                    <Clock className="w-8 h-8" />
                  </div>
                </div>
                <h2 className="text-xl font-extrabold" style={{ color: '#303653' }}>Verification Under Review</h2>
                <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: '#85899B' }}>
                  Your institutional registration has been submitted. Campus administrators verify student ID cards to ensure safe peer-to-peer sharing.
                </p>
              </div>

              {/* Progress Milestones */}
              <div className="space-y-3 p-4 rounded-2xl text-xs" style={{ backgroundColor: '#FFF8ED', border: '1px solid #EAE6E1' }}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold" style={{ color: '#303653' }}>Student Registration Created</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold" style={{ color: '#303653' }}>Institutional Email Verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0" style={{ borderColor: '#7563D9', borderTopColor: 'transparent' }} />
                  <span className="font-bold" style={{ color: '#7563D9' }}>Administrator ID Card Verification (In Progress)</span>
                </div>
                <div className="flex items-center gap-3" style={{ color: '#85899B' }}>
                  <div className="w-4 h-4 rounded-full border shrink-0" style={{ borderColor: '#EAE6E1' }} />
                  <span>Campus Marketplace &amp; Rental Access</span>
                </div>
              </div>

              {/* Summary details */}
              {verification && (
                <div className="pt-4 text-xs space-y-1.5" style={{ borderTop: '1px solid #EAE6E1', color: '#303653' }}>
                  <div className="flex justify-between">
                    <span style={{ color: '#85899B' }}>Registered Email:</span>
                    <span className="font-medium">{verification.user_email || emailParam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#85899B' }}>Roll Number:</span>
                    <span className="font-mono font-bold">{verification.roll_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#85899B' }}>Campus:</span>
                    <span className="font-medium">{verification.college_name || 'Aditya University'}</span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  style={{ backgroundColor: '#E9E3FF', color: '#303653' }}
                  onMouseEnter={e => !refreshing && (e.currentTarget.style.backgroundColor = '#D8D0F5')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#E9E3FF')}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Check Live Status</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="py-3 px-3 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  style={{ border: '1px solid #EAE6E1', color: '#303653', backgroundColor: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF8ED')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
