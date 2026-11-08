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
    setEmail('sai.reddy@adityauniversity.in');
    setPassword('StudentPassword123!');
    setErrorMessage('');
    try {
      setLoading(true);
      const res = await authService.login('sai.reddy@adityauniversity.in', 'StudentPassword123!');
      login(res.access, res.refresh, res.user);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Demo student login failed. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setEmail('admin@adityauniversity.in');
    setPassword('AdminPassword123!');
    setErrorMessage('');
    try {
      setLoading(true);
      const res = await authService.login('admin@adityauniversity.in', 'AdminPassword123!');
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
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans" style={{ backgroundColor: '#FFF8ED', color: '#303653' }}>
      {/* Soft Ambient Background Blooms */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(117,99,217,0.06)' }} />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(66,168,121,0.06)' }} />

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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2" style={{ backgroundColor: '#E9E3FF', border: '1px solid #D8D0F5', color: '#7563D9' }}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Aditya University Campus Network</span>
          </div>
          <h2 className="text-xl font-extrabold" style={{ color: '#303653' }}>Student &amp; Faculty Portal</h2>
          <p className="text-xs mt-1 max-w-xs" style={{ color: '#85899B' }}>
            Access verified campus equipment, academic tools, and lab gear.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl shadow-sm p-8" style={{ backgroundColor: '#FFFCF7', border: '1px solid #EAE6E1' }}>
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
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#303653' }}>
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#85899B' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student.name@adityauniversity.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: '#FFFCF7',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#7563D9';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(117,99,217,0.12)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#EAE6E1';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold" style={{ color: '#303653' }}>Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: '#7563D9' }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#85899B' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: '#FFFCF7',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#7563D9';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(117,99,217,0.12)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#EAE6E1';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: '#85899B' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#7563D9', boxShadow: '0 4px 16px rgba(117,99,217,0.30)' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#6552C5')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7563D9')}
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
          <div className="mt-6 pt-5 space-y-2" style={{ borderTop: '1px solid #EAE6E1' }}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-center" style={{ color: '#85899B' }}>
              Quick 1-Click Evaluation Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDemoStudentLogin}
                className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                style={{ border: '1px solid #D8D0F5', backgroundColor: 'rgba(233,227,255,0.6)', color: '#303653' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E9E3FF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(233,227,255,0.6)')}
              >
                🎓 Demo Student
                <span className="block text-[10px] font-medium mt-0.5" style={{ color: '#7563D9' }}>Sai Reddy (Aditya Univ)</span>
              </button>
              <button
                type="button"
                onClick={handleDemoAdminLogin}
                className="py-2.5 px-3 rounded-xl border border-amber-100 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 text-xs font-bold transition-all text-center cursor-pointer"
              >
                🛡️ Campus Admin
                <span className="block text-[10px] font-medium text-amber-700/90 mt-0.5">Identity Approver</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs" style={{ color: '#85899B' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: '#7563D9' }}>
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
              className="rounded-3xl max-w-sm w-full p-6 shadow-xl"
              style={{ backgroundColor: '#FFFCF7', border: '1px solid #EAE6E1' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}>
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold" style={{ color: '#303653' }}>Reset Password</h3>
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
                  <p className="text-xs" style={{ color: '#85899B' }}>
                    Enter your institutional email. We will dispatch a 6-digit verification code.
                  </p>
                  <div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="student.name@adityauniversity.in"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                      style={{ border: '1px solid #EAE6E1', backgroundColor: '#FFF8ED', color: '#303653' }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#7563D9';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(117,99,217,0.12)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#EAE6E1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ border: '1px solid #EAE6E1', color: '#303653', backgroundColor: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF8ED')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2 rounded-xl text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: '#7563D9' }}
                      onMouseEnter={e => !forgotLoading && (e.currentTarget.style.backgroundColor = '#6552C5')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7563D9')}
                    >
                      {forgotLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  <p className="text-xs" style={{ color: '#85899B' }}>
                    Enter the 6-digit code received at <span className="font-semibold" style={{ color: '#303653' }}>{forgotEmail}</span> and your new password.
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold" style={{ color: '#303653' }}>6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2 rounded-xl text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 transition-all"
                      style={{ border: '1px solid #EAE6E1', backgroundColor: '#FFF8ED', color: '#303653' }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#7563D9';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(117,99,217,0.12)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#EAE6E1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold" style={{ color: '#303653' }}>New Password (min 8 chars)</label>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                      style={{ border: '1px solid #EAE6E1', backgroundColor: '#FFF8ED', color: '#303653' }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#7563D9';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(117,99,217,0.12)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#EAE6E1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('EMAIL')}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ border: '1px solid #EAE6E1', color: '#303653', backgroundColor: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF8ED')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2 rounded-xl text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: '#7563D9' }}
                      onMouseEnter={e => !forgotLoading && (e.currentTarget.style.backgroundColor = '#6552C5')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7563D9')}
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
