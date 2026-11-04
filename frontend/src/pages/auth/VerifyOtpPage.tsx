import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, RotateCcw, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const emailParam = searchParams.get('email') || '';
  const [email] = useState<string>(emailParam);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 5-minute countdown (300 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(300);
  // 60-second cooldown for resend
  const [cooldown, setCooldown] = useState<number>(60);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Countdown timer for 5-minute OTP validity
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Countdown timer for 60s cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    const nextOtp = [...otp];
    // Handle paste of full 6 digits
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (i < 6) nextOtp[i] = c;
      });
      setOtp(nextOtp);
      const focusTarget = Math.min(chars.length, 5);
      inputRefs.current[focusTarget]?.focus();
      return;
    }

    nextOtp[index] = cleaned[0];
    setOtp(nextOtp);

    // Auto-advance
    if (index < 5 && cleaned[0]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    try {
      setVerifying(true);
      const res = await authService.verifyEmail(email, fullOtp);
      setSuccessMessage('Institutional email verified successfully!');
      login(res.access, res.refresh, res.user);

      // Navigate to verification pending view
      setTimeout(() => {
        navigate(`/verification-pending?email=${encodeURIComponent(email)}`);
      }, 1200);
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.otp || data?.detail || data?.message || 'Verification failed. Please check the code.';
      setErrorMessage(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      setResending(true);
      await authService.resendOTP(email);
      setSuccessMessage('A fresh 6-digit verification code has been dispatched to your email.');
      setCooldown(60);
      setTimeLeft(300);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative campus wave background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#F5A623]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0E131F]/5 rounded-full blur-3xl pointer-events-none" />

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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Step 2 of 3: Email Verification</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0E131F]">Verify Institutional Email</h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            We sent a secure 6-digit verification code to:
          </p>
          <p className="text-xs font-bold text-[#0E131F] mt-0.5">{email || 'your institutional email'}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-8">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {/* 6 Digit Inputs */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 text-center mb-3">
                Enter 6-Digit Code
              </label>
              <div className="flex justify-between gap-2 max-w-xs mx-auto">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Timer and Cooldown */}
            <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 px-1">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Expires in:</span>
                <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-neutral-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="inline-flex items-center gap-1 text-[#F5A623] hover:underline font-semibold disabled:text-neutral-400 disabled:no-underline"
              >
                <RotateCcw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                <span>{cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={verifying || otp.join('').length !== 6}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0E131F] text-white font-semibold text-sm hover:bg-[#1a233a] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {verifying ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Email & Proceed</span>
                  <ArrowRight className="w-4 h-4 text-[#F5A623]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-500">
            Wrong institutional email?{' '}
            <Link to="/register" className="font-semibold text-[#0E131F] hover:text-[#F5A623]">
              Re-enter registration details
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
