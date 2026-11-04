import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';
import { Logo } from '../../components/common/Logo';

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
      const msg =
        resp?.detail ||
        resp?.message ||
        (typeof resp === 'string' ? resp : 'Invalid credentials. Please verify your email and password.');
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
      }, 1800);
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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-800">
      {/* Soft Ambient Background Blooms */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#5B4DFF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header with Authentic Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-block mb-3 hover:opacity-95 transition-opacity">
            <Logo size="lg" />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-[#5B4DFF] text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VNRVJIET Campus Network</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#1E1B4B]">Student & Faculty Portal</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Access verified campus equipment, academic tools, and lab gear.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-xs text-red-700"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student.name@vnrvjiet.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] transition-all bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold text-[#5B4DFF] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] transition-all bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#5B4DFF] hover:bg-[#4F46E5] text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Quick 1-Click Evaluation Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDemoStudentLogin}
                className="py-2.5 px-3 rounded-xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-900 text-xs font-bold transition-all text-center cursor-pointer"
              >
                🎓 Demo Student
                <span className="block text-[10px] font-medium text-indigo-600/90 mt-0.5">Sai Reddy (VNR)</span>
              </button>
              <button
                type="button"
                onClick={handleDemoAdminLogin}
                className="py-2.5 px-3 rounded-xl border border-amber-100 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 text-xs font-bold transition-all text-center cursor-pointer"
              >
                🛡️ Campus Admin
                <span className="block text-[10px] font-medium text-amber-700/90 mt-0.5">ID Card Reviewer</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#5B4DFF] hover:underline">
              Register with College ID
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5B4DFF]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#1E1B4B]">Reset Password</h3>
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
                  <p className="text-xs text-slate-500">
                    Enter your institutional email. We will dispatch a 6-digit verification code.
                  </p>
                  <div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="student@vnrvjiet.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30"
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2 rounded-xl bg-[#5B4DFF] hover:bg-[#4F46E5] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {forgotLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Enter the 6-digit code received at <span className="font-semibold text-slate-700">{forgotEmail}</span> and your new password.
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">New Password (min 8 chars)</label>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('EMAIL')}
                      className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2 rounded-xl bg-[#5B4DFF] hover:bg-[#4F46E5] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
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
