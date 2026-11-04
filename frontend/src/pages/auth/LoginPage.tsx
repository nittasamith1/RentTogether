import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>(searchParams.get('email') || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'OTP_RESET'>('EMAIL');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotMsg, setForgotMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.login(email.trim(), password);
      login(res.access, res.refresh, res.user);

      if (res.user.is_staff) {
        navigate('/admin/verifications');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.code === 'EMAIL_NOT_VERIFIED') {
        navigate(`/verify-email?email=${encodeURIComponent(resp.email || email)}`);
        return;
      }
      if (resp?.code === 'COLLEGE_VERIFICATION_PENDING' || resp?.code === 'COLLEGE_VERIFICATION_REJECTED') {
        navigate(`/verification-pending?email=${encodeURIComponent(resp.email || email)}`);
        return;
      }
      const msg = resp?.detail || resp?.message || (typeof resp === 'string' ? resp : 'Invalid credentials. Please verify your email and password.');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStudentLogin = async () => {
    setEmail('sai.reddy@vnrvjiet.in');
    setPassword('StudentPassword123!');
    setErrorMessage('');
    try {
      setLoading(true);
      const res = await authService.login('sai.reddy@vnrvjiet.in', 'StudentPassword123!');
      login(res.access, res.refresh, res.user);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Demo student login failed. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setEmail('admin@vnrvjiet.in');
    setPassword('AdminPassword123!');
    setErrorMessage('');
    try {
      setLoading(true);
      const res = await authService.login('admin@vnrvjiet.in', 'AdminPassword123!');
      login(res.access, res.refresh, res.user);
      navigate('/admin/verifications');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Demo admin login failed. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    if (!forgotEmail) {
      setForgotMsg({ text: 'Please enter your institutional email.', isError: true });
      return;
    }
    try {
      setForgotLoading(true);
      const res = await authService.requestPasswordReset(forgotEmail.trim());
      setForgotMsg({ text: res.message || 'Verification code sent to your email.', isError: false });
      setForgotStep('OTP_RESET');
    } catch (err: any) {
      setForgotMsg({
        text: err.response?.data?.email?.[0] || err.response?.data?.detail || 'Failed to send reset code.',
        isError: true,
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    if (!forgotOtp || !forgotNewPassword) {
      setForgotMsg({ text: 'Please fill in all fields.', isError: true });
      return;
    }
    try {
      setForgotLoading(true);
      const res = await authService.confirmPasswordReset(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
      setForgotMsg({ text: res.message || 'Password successfully reset! You can now log in.', isError: false });
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('EMAIL');
        setForgotOtp('');
        setForgotNewPassword('');
      }, 2000);
    } catch (err: any) {
      setForgotMsg({
        text: err.response?.data?.otp?.[0] || err.response?.data?.detail || 'Password reset failed.',
        isError: true,
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative campus wave background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#F5A623]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0E131F]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 group mb-3">
            <span className="text-3xl font-extrabold tracking-tight text-[#0E131F]">
              Rent<span className="text-[#F5A623]">Together</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VNRVJIET Campus Network</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0E131F]">Student & Faculty Login</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Access verified peer-to-peer campus rentals, academic kits, and tools.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-8">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-xs text-red-700"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vnrvjiet.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all bg-neutral-50/50 hover:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-neutral-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold text-[#F5A623] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all bg-neutral-50/50 hover:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0E131F] text-white font-semibold text-sm hover:bg-[#1a233a] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#F5A623]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Pair Programming / Evaluation */}
          <div className="mt-6 pt-5 border-t border-neutral-100 space-y-2">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider text-center">
              Quick 1-Click Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDemoStudentLogin}
                className="py-2 px-2.5 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 text-xs font-semibold transition-all text-center"
              >
                🎓 Demo Student
                <span className="block text-[10px] font-normal text-amber-700/80">Sai Reddy (VNR)</span>
              </button>
              <button
                type="button"
                onClick={handleDemoAdminLogin}
                className="py-2 px-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-900 text-xs font-semibold transition-all text-center"
              >
                🛡️ Campus Admin
                <span className="block text-[10px] font-normal text-indigo-700/80">Identity Approver</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-neutral-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#0E131F] hover:text-[#F5A623] transition-colors">
              Register with College ID
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-neutral-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-[#F5A623]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0E131F]">Reset Password</h3>
              </div>

              {forgotMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                    forgotMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {forgotMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{forgotMsg.text}</span>
                </div>
              )}

              {forgotStep === 'EMAIL' ? (
                <form onSubmit={handleSendResetCode} className="space-y-3">
                  <p className="text-xs text-neutral-500">
                    Enter your institutional email. We will dispatch a 6-digit verification code.
                  </p>
                  <div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="student@vnrvjiet.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2 rounded-xl bg-[#0E131F] text-white text-xs font-semibold hover:bg-[#1a233a] disabled:opacity-50"
                    >
                      {forgotLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  <p className="text-xs text-neutral-500">
                    Enter the 6-digit code received at <span className="font-semibold text-neutral-700">{forgotEmail}</span> and your new password.
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-700">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-700">New Password (min 8 chars)</label>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('EMAIL')}
                      className="flex-1 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2 rounded-xl bg-[#0E131F] text-white text-xs font-semibold hover:bg-[#1a233a] disabled:opacity-50"
                    >
                      {forgotLoading ? 'Resetting...' : 'Set Password'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
