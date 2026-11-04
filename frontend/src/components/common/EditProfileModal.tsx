import React, { useState } from 'react';
import { X, Upload, Check, AlertCircle, MapPin, Phone, FileText } from 'lucide-react';
import { profileService } from '../../services/profile';
import { DetailedStudentProfile } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: DetailedStudentProfile;
  onProfileUpdated: (updated: DetailedStudentProfile) => void;
}

const CAMPUS_PICKUP_OPTIONS = [
  'Central Library',
  'Main Canteen & Food Court',
  'Ratan Tata Engineering Block',
  'Mechanical Workshop & Labs',
  'Electrical & VLSI Building',
  'Boys Hostel Block A',
  'Girls Hostel Main Gate',
  'Campus Sports Complex',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
}) => {
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(currentProfile.phone_number || '');
  const [selectedSpots, setSelectedSpots] = useState<string[]>(
    currentProfile.preferred_pickup_spots || []
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(currentProfile.avatar_url || '');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpotToggle = (spot: string) => {
    if (selectedSpots.includes(spot)) {
      setSelectedSpots(selectedSpots.filter((s) => s !== spot));
    } else {
      setSelectedSpots([...selectedSpots, spot]);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Avatar image size must be under 5 MB.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    // Validate phone number format
    const cleanedPhone = phoneNumber.replace(/[\s-]/g, '');
    if (cleanedPhone && !/^(?:\+91)?[6-9]\d{9}$/.test(cleanedPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.');
      setIsSaving(false);
      return;
    }

    try {
      const updated = await profileService.updateProfileMe({
        bio: bio.trim(),
        phone_number: cleanedPhone,
        preferred_pickup_spots: selectedSpots,
        avatar: avatarFile || undefined,
      });
      onProfileUpdated(updated);
      onClose();
    } catch (err: any) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        const first = Object.values(data)[0];
        setErrorMsg(Array.isArray(first) ? first[0] : String(first || 'Update failed'));
      } else {
        setErrorMsg('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-xl font-black text-slate-900">Edit Student Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your campus avatar, contact information, and meetup spots.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Change */}
          <div className="flex items-center gap-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-white shadow-xs relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#5B4DFF]/10 text-[#5B4DFF] font-black text-xl">
                  {currentProfile.user?.first_name?.charAt(0) || 'S'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Profile Photo
              </label>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#5B4DFF]" />
                <span>Upload New Photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-slate-400 block mt-1">
                JPG, PNG or WEBP (Max 5MB)
              </span>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
              <Phone className="w-3.5 h-3.5 text-[#5B4DFF]" />
              <span>Mobile Number (Kept Private to Confirmed Bookings)</span>
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF]"
            />
          </div>

          {/* Student Bio */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
              <FileText className="w-3.5 h-3.5 text-[#5B4DFF]" />
              <span>Bio & Academic Interests</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell fellow students about your course, projects, or rental equipment..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] resize-none"
            />
            <div className="text-right text-[10px] text-slate-400 mt-0.5">
              {bio.length} / 500 characters
            </div>
          </div>

          {/* Preferred Campus Pickup Spots */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#5B4DFF]" />
              <span>Preferred Aditya University Meetup Spots</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CAMPUS_PICKUP_OPTIONS.map((spot) => {
                const isSelected = selectedSpots.includes(spot);
                return (
                  <button
                    type="button"
                    key={spot}
                    onClick={() => handleSpotToggle(spot)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-[#5B4DFF] bg-[#5B4DFF]/5 text-[#5B4DFF]'
                        : 'border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[#5B4DFF] border-[#5B4DFF] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{spot}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locked Identity Banner */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            <strong>Aditya University Identity Security:</strong> Roll number (
            {currentProfile.roll_number || '21A91A0501'}), Department (
            {currentProfile.department || 'CSE'}), and Institutional Email are securely verified
            and cannot be altered.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#5B4DFF] hover:bg-[#4d3eff] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-60"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

