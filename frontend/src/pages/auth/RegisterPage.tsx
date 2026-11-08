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

      const otpParam = res.dev_otp ? `&otp=${encodeURIComponent(res.dev_otp)}` : '';
      navigate(`/verify-email?email=${encodeURIComponent(res.email || email.trim().toLowerCase())}${otpParam}`);
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

  const inputStyle = {
    backgroundColor: '#FFFCF7',
    border: '1px solid #EAE6E1',
    color: '#303653',
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#7563D9';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(117,99,217,0.12)';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#EAE6E1';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans" style={{ backgroundColor: '#FFF8ED', color: '#303653' }}>
      {/* Soft Ambient Background Blooms */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(117,99,217,0.06)' }} />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(66,168,121,0.06)' }} />

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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2" style={{ backgroundColor: '#E9E3FF', border: '1px solid #D8D0F5', color: '#7563D9' }}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Institutional Identity Registration</span>
          </div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#303653' }}>Join Campus Network</h2>
          <p className="text-xs mt-1 max-w-md mx-auto" style={{ color: '#85899B' }}>
            {collegeLoading
              ? 'Loading active campus configuration...'
              : `One account for renting & lending exclusively for ${college?.name || 'Aditya University'} students.`}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl shadow-sm p-8 sm:p-9" style={{ backgroundColor: '#FFFCF7', border: '1px solid #EAE6E1' }}>
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
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#85899B' }}>
                1. Institutional Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#303653' }}>
                    Full Student Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#85899B' }} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sai Reddy"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#303653' }}>
                    Roll Number
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#85899B' }} />
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 21A91A05B8"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 transition-all font-mono"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#303653' }}>
                  Institutional Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#85899B' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="student.name@adityauniversity.in"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    required
                  />
                  {emailDomainValid === true && (
                    <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                  {emailDomainValid === false && (
                    <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="text-[11px] mt-1" style={{ color: '#85899B' }}>
                  Must be an institutional address ending in{' '}
                  <span className="font-semibold" style={{ color: '#303653' }}>
                    {college?.domain_whitelist?.join(' or ')}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#303653' }}>
                    Department
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#85899B' }} />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
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
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#303653' }}>
                    Year of Study
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setYearOfStudy(yr)}
                        className="py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer"
                        style={
                          yearOfStudy === yr
                            ? { backgroundColor: '#7563D9', color: '#fff', borderColor: '#7563D9' }
                            : { backgroundColor: '#FFF8ED', color: '#303653', borderColor: '#EAE6E1' }
                        }
                        onMouseEnter={e => yearOfStudy !== yr && (e.currentTarget.style.backgroundColor = '#E9E3FF')}
                        onMouseLeave={e => yearOfStudy !== yr && (e.currentTarget.style.backgroundColor = '#FFF8ED')}
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
            <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #EAE6E1' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#85899B' }}>
                  2. Student ID Card Photo
                </h3>
                <span className="text-[11px]" style={{ color: '#85899B' }}>Required for campus verification</span>
              </div>

              <div
                className="relative rounded-2xl p-5 text-center transition-all"
                style={{ border: '2px dashed #EAE6E1', backgroundColor: 'rgba(255,248,237,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#7563D9')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#EAE6E1')}
              >
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
                      className="w-48 h-28 object-cover rounded-xl shadow-sm mb-3"
                      style={{ border: '1px solid #EAE6E1' }}
                    />
                    <label
                      htmlFor="id-card-upload"
                      className="cursor-pointer text-xs font-bold hover:underline"
                      style={{ color: '#7563D9' }}
                    >
                      Change photo
                    </label>
                  </div>
                ) : (
                  <label htmlFor="id-card-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}>
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#303653' }}>
                      Upload College ID Card
                    </span>
                    <span className="text-[11px] mt-0.5" style={{ color: '#85899B' }}>
                      Clear photo showing name, photo, and roll number (PNG/JPG, max 5MB)
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* 3. Account Security */}
            <div className="space-y-4 pt-2" style={{ borderTop: '1px solid #EAE6E1' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#85899B' }}>
                3. Password
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#303653' }}>
                    Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#85899B' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      required
                      minLength={8}
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

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#303653' }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#85899B' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
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
              className="w-full mt-4 py-3.5 px-4 rounded-xl text-white font-bold text-xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#7563D9', boxShadow: '0 4px 16px rgba(117,99,217,0.30)' }}
              onMouseEnter={e => !(submitting || emailDomainValid === false) && (e.currentTarget.style.backgroundColor = '#6552C5')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7563D9')}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account &amp; Verify Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs" style={{ color: '#85899B' }}>
            Already registered?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: '#7563D9' }}>
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
