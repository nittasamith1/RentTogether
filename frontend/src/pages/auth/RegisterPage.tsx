import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  IdCard,
  Building,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../../services/auth';
import { College } from '../../types';
import { Logo } from '../../components/common/Logo';

const DEPARTMENTS = [
  'Computer Science and Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Artificial Intelligence & Data Science (AI&DS)',
  'Computer Science & Business Systems (CSBS)',
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Active College State
  const [college, setCollege] = useState<College | null>(null);
  const [collegeLoading, setCollegeLoading] = useState<boolean>(true);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rollNumber, setRollNumber] = useState<string>('');
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [yearOfStudy, setYearOfStudy] = useState<number>(1);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);

  // Status & Validation
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [emailDomainValid, setEmailDomainValid] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchCollege = async () => {
      try {
        setCollegeLoading(true);
        const data = await authService.getActiveCollege();
        setCollege(data);
      } catch {
        setCollege({
          id: 'aditya-id',
          name: 'Aditya University',
          code: 'ADITYA',
          domain_whitelist: ['adityauniversity.in', 'aditya.ac.in'],
          is_active: true,
        });
      } finally {
        setCollegeLoading(false);
      }
    };
    fetchCollege();
  }, []);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const trimmed = val.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setEmailDomainValid(null);
      return;
    }
    const domain = trimmed.split('@')[1];
    if (college?.domain_whitelist) {
      const allowed = college.domain_whitelist.some(
        (d) => domain === d || domain.endsWith('.' + d)
      );
      setEmailDomainValid(allowed);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please select a valid image file (PNG, JPG, or JPEG).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('ID card image must be smaller than 5 MB.');
        return;
      }
      setIdCardFile(file);
      setFormError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (emailDomainValid === false) {
      setFormError(
        `Email must end with an approved college domain (e.g. ${college?.domain_whitelist?.join(', ')}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await authService.register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        roll_number: rollNumber.trim().toUpperCase(),
        department,
        year_of_study: yearOfStudy,
        id_card_image: idCardFile,
      });

      navigate(`/verify-email?email=${encodeURIComponent(res.email || email.trim().toLowerCase())}`);
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Registration failed. Please verify your details.';
      if (typeof data === 'string') {
        msg = data;
      } else if (data?.email) {
        msg = Array.isArray(data.email) ? data.email[0] : data.email;
      } else if (data?.roll_number) {
        msg = Array.isArray(data.roll_number) ? data.roll_number[0] : data.roll_number;
      } else if (data?.detail) {
        msg = data.detail;
      }
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-800">
      {/* Soft Ambient Background Blooms */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#5B4DFF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Header with Authentic Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-block mb-3 hover:opacity-95 transition-opacity">
            <Logo size="lg" />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-[#5B4DFF] text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Institutional Identity Registration</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#1E1B4B]">Join Campus Network</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {collegeLoading
              ? 'Loading active campus configuration...'
              : `One account for renting & lending exclusively for ${college?.name || 'Aditya University'} students.`}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-9">
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-xs text-red-700"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Academic Credentials */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Institutional Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Student Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sai Reddy"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Roll Number
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 21A91A05B8"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] bg-white font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="student.name@adityauniversity.in"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] bg-white"
                    required
                  />
                  {emailDomainValid === true && (
                    <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                  {emailDomainValid === false && (
                    <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Must be an institutional address ending in{' '}
                  <span className="font-semibold text-slate-600">
                    {college?.domain_whitelist?.join(' or ')}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 bg-white"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Year of Study
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setYearOfStudy(yr)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          yearOfStudy === yr
                            ? 'bg-[#5B4DFF] text-white border-[#5B4DFF] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {yr}
                        <span className="text-[10px] ml-0.5">
                          {yr === 1 ? 'st' : yr === 2 ? 'nd' : yr === 3 ? 'rd' : 'th'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. College ID Card Upload */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  2. Student ID Card Photo
                </h3>
                <span className="text-[11px] text-slate-400">Required for campus verification</span>
              </div>

              <div className="relative border-2 border-dashed border-slate-200 hover:border-[#5B4DFF] rounded-2xl p-5 text-center transition-all bg-slate-50/50">
                <input
                  type="file"
                  id="id-card-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {idCardPreview ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={idCardPreview}
                      alt="ID Preview"
                      className="w-48 h-28 object-cover rounded-xl border border-slate-200 shadow-sm mb-3"
                    />
                    <label
                      htmlFor="id-card-upload"
                      className="cursor-pointer text-xs font-bold text-[#5B4DFF] hover:underline"
                    >
                      Change photo
                    </label>
                  </div>
                ) : (
                  <label htmlFor="id-card-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5B4DFF] mb-2">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      Upload College ID Card
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Clear photo showing name, photo, and roll number (PNG/JPG, max 5MB)
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* 3. Account Security */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. Password
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 bg-white"
                      required
                      minLength={8}
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 bg-white"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || emailDomainValid === false}
              className="w-full mt-4 py-3.5 px-4 rounded-xl bg-[#5B4DFF] hover:bg-[#4F46E5] text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Verify Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-[#5B4DFF] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
