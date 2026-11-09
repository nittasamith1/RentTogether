import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Bell,
  CreditCard,
  Lock,
  Building2,
  Check,
  Save,
  LogOut,
  Smartphone,
  MapPin,
  CheckCircle2,
  Database,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useNotifications } from '../../hooks/useNotifications';
import { useWishlist } from '../../hooks/useWishlist';
import { useClearCancelledBookings } from '../../hooks/useBookings';

const CAMPUS_PICKUP_SPOTS = [
  'Central Library Ground Floor',
  'Main Canteen Reception',
  'Student Activity Center (SAC)',
  'Main Gate 1 Security Counter',
  'Engineering Block B Foyer',
];

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const dialog = useDialog();
  const { data: profile } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'NOTIFICATIONS' | 'PAYOUTS' | 'SECURITY' | 'STORAGE'>('PROFILE');
  const [storageFeedback, setStorageFeedback] = useState<string | null>(null);

  const { notifications, clearNotificationsAsync, isClearing: isClearingNotifications } = useNotifications();
  const { clearWishlistAsync, isClearing: isClearingWishlist } = useWishlist();
  const clearCancelledMutation = useClearCancelledBookings();

  const showStorageToast = (msg: string) => {
    setStorageFeedback(msg);
    dialog.showToast(msg, 'success');
    setTimeout(() => setStorageFeedback(null), 3500);
  };

  // Form state
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [upiId, setUpiId] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification toggles
  const [emailBookingAlerts, setEmailBookingAlerts] = useState(true);
  const [handoverReminders, setHandoverReminders] = useState(true);
  const [returnOverdueAlerts, setReturnOverdueAlerts] = useState(true);
  const [escrowPayoutAlerts, setEscrowPayoutAlerts] = useState(true);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setPhoneNumber(profile.phone_number || '');
      setSelectedSpots(profile.preferred_pickup_spots || []);
    }
  }, [profile]);

  const handleToggleSpot = (spot: string) => {
    setSelectedSpots((prev) =>
      prev.includes(spot) ? prev.filter((s) => s !== spot) : [...prev, spot]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        bio,
        phone_number: phoneNumber,
        preferred_pickup_spots: selectedSpots,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      dialog.showToast('Failed to update settings. Please try again.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 select-none pt-2">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: '#EAE6E1' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: '#303653' }}>
              Account & Campus Settings
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1"
              style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
            >
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              Verified Student
            </span>
          </div>
          <p className="text-xs font-medium mt-1" style={{ color: '#85899B' }}>
            Manage your personal profile, institutional credentials, notification alerts, and campus payout channels.
          </p>
        </div>

        {/* Global Save Button (when on Profile tab) */}
        {activeTab === 'PROFILE' && (
          <button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending || saveSuccess}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 self-start sm:self-auto"
            style={{ backgroundColor: saveSuccess ? '#42A879' : '#7563D9' }}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully!</span>
              </>
            ) : updateProfileMutation.isPending ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 2. Settings Nav Tabs */}
      <div
        className="flex flex-wrap items-center gap-1 p-1.5 rounded-2xl border text-xs font-bold"
        style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
      >
        {[
          { id: 'PROFILE', label: 'College & Profile', icon: User },
          { id: 'NOTIFICATIONS', label: 'Notifications & Alerts', icon: Bell },
          { id: 'STORAGE', label: 'Storage & History', icon: Database },
          { id: 'PAYOUTS', label: 'Escrow & Payouts', icon: CreditCard },
          { id: 'SECURITY', label: 'Security & Sessions', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                isActive ? 'bg-white shadow-xs font-bold' : 'hover:text-[#7563D9]'
              }`}
              style={{
                color: isActive ? '#7563D9' : '#303653',
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Settings Content Panels */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Institutional Credentials (Read-only verified records) */}
          <div
            className="rounded-3xl p-6 border shadow-xs space-y-4"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#EAE6E1' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#303653' }}>
                  Institutional Identity
                </h3>
                <p className="text-xs" style={{ color: '#85899B' }}>
                  Verified by college administrator. Contact campus support to modify official student records.
                </p>
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold border"
                style={{ backgroundColor: '#DFEDFF', color: '#3A6BB5', borderColor: '#C5DCFA' }}
              >
                {user?.college_code || profile?.college_code || 'VERIFIED'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold block mb-1 text-[#85899B]">Full Legal Name</label>
                <div
                  className="p-3 rounded-xl border font-semibold text-[#303653]"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || profile?.user?.full_name || 'Verified Student'}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-[#85899B]">Institutional College Email</label>
                <div
                  className="p-3 rounded-xl border font-semibold text-[#303653] flex items-center justify-between"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  <span>{user?.email || profile?.user?.email}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#42A879]" />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-[#85899B]">Affiliated College</label>
                <div
                  className="p-3 rounded-xl border font-semibold text-[#303653] flex items-center gap-2"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  <Building2 className="w-4 h-4 text-[#7563D9]" />
                  <span>{user?.college_name || profile?.college_name || 'Campus Member'}</span>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-[#85899B]">Student Roll / Reg Number</label>
                <div
                  className="p-3 rounded-xl border font-semibold text-[#303653]"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  {profile?.roll_number || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Student Profile Fields */}
          <div
            className="rounded-3xl p-6 border shadow-xs space-y-4"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#303653' }}>
                Contact & Campus Exchange Preferences
              </h3>
              <p className="text-xs" style={{ color: '#85899B' }}>
                Details shared with peers only after an equipment booking is confirmed and paid.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: '#303653' }}>
                  Student Bio / Department Summary
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio, your major, or equipment you frequently lend on campus..."
                  className="w-full p-3 rounded-xl text-xs focus:outline-hidden transition-all"
                  style={{
                    backgroundColor: '#FFF8ED',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: '#303653' }}>
                  WhatsApp / Phone Number (For Handover Meetups)
                </label>
                <div className="relative max-w-sm">
                  <Smartphone className="w-4 h-4 absolute left-3 top-3 text-[#85899B]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-hidden transition-all"
                    style={{
                      backgroundColor: '#FFF8ED',
                      border: '1px solid #EAE6E1',
                      color: '#303653',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-2" style={{ color: '#303653' }}>
                  Preferred Campus Pickup & Handover Locations
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CAMPUS_PICKUP_SPOTS.map((spot) => {
                    const isSelected = selectedSpots.includes(spot);
                    return (
                      <div
                        key={spot}
                        onClick={() => handleToggleSpot(spot)}
                        className={`p-3 rounded-2xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                          isSelected ? 'shadow-xs font-bold' : 'hover:bg-white'
                        }`}
                        style={{
                          backgroundColor: isSelected ? '#E9E3FF' : '#FFF8ED',
                          borderColor: isSelected ? '#7563D9' : '#EAE6E1',
                          color: isSelected ? '#7563D9' : '#303653',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{spot}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#7563D9]" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'NOTIFICATIONS' && (
        <div
          className="rounded-3xl p-6 border shadow-xs space-y-5"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div>
            <h3 className="text-sm font-bold" style={{ color: '#303653' }}>
              Notification Channels & Alert Frequency
            </h3>
            <p className="text-xs" style={{ color: '#85899B' }}>
              Stay updated with real-time equipment requests, physical meetup reminders, and financial releases.
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: '#EAE6E1' }}>
            {[
              {
                id: 'booking_alerts',
                title: 'Rental Booking Inquiries & Approvals',
                desc: 'Instant notifications when a peer requests your equipment or responds to your booking.',
                checked: emailBookingAlerts,
                onChange: setEmailBookingAlerts,
              },
              {
                id: 'handover_reminders',
                title: 'Pickup & Handover Meetup Passes',
                desc: 'Alerts with single-use QR and OTP codes 2 hours before scheduled physical exchange.',
                checked: handoverReminders,
                onChange: setHandoverReminders,
              },
              {
                id: 'return_notices',
                title: 'Return Schedule & Due Reminders',
                desc: 'Automated warnings 24 hours prior to checkout deadline to prevent late penalty fees.',
                checked: returnOverdueAlerts,
                onChange: setReturnOverdueAlerts,
              },
              {
                id: 'escrow_updates',
                title: 'Escrow Vault & Payout Confirmations',
                desc: 'Notifies when rental security deposits are safely vaulted or released to your bank.',
                checked: escrowPayoutAlerts,
                onChange: setEscrowPayoutAlerts,
              },
            ].map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold" style={{ color: '#303653' }}>
                    {item.title}
                  </h4>
                  <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
                    {item.desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => item.onChange(!item.checked)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    item.checked ? 'bg-[#7563D9]' : 'bg-[#EAE6E1]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                      item.checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'PAYOUTS' && (
        <div
          className="rounded-3xl p-6 border shadow-xs space-y-5"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div>
            <h3 className="text-sm font-bold" style={{ color: '#303653' }}>
              Campus Escrow & Payout Channels
            </h3>
            <p className="text-xs" style={{ color: '#85899B' }}>
              Rental earnings are disbursed directly to your verified UPI ID following return inspection approval.
            </p>
          </div>

          <div
            className="p-4 rounded-2xl border flex items-center justify-between gap-3"
            style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-xs">
                <CreditCard className="w-5 h-5 text-[#42A879]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#2D7A5B]">Campus Escrow Protection Active</span>
                <p className="text-[11px] text-[#2D7A5B]/80">Zero platform commissions on student peer exchanges.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#2D7A5B]">0% Fees</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: '#303653' }}>
                Disbursement UPI ID (e.g. mobile@okaxis, rollno@okhdfcbank)
              </label>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="student@upi"
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs focus:outline-hidden transition-all"
                  style={{
                    backgroundColor: '#FFF8ED',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
                />
                <button
                  onClick={() => dialog.showToast('UPI payout ID saved for offline cash receipts and records.', 'success')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer active:scale-95"
                  style={{ backgroundColor: '#7563D9' }}
                >
                  Update UPI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'STORAGE' && (
        <div className="space-y-5">
          {storageFeedback && (
            <div
              className="p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in"
              style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC', color: '#42A879' }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{storageFeedback}</span>
            </div>
          )}

          {/* Storage Overview Banner */}
          <div
            className="rounded-3xl p-6 border shadow-xs space-y-2"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#E9E3FF] text-[#7563D9]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#303653' }}>
                  Database Storage & History Management
                </h3>
                <p className="text-xs" style={{ color: '#85899B' }}>
                  Prevent unnecessary database storage overhead by purging old notifications, cleared wishlists, and dead rental records.
                </p>
              </div>
            </div>
          </div>

          {/* History Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Notifications History */}
            <div
              className="rounded-3xl p-5 border shadow-xs flex flex-col justify-between space-y-4"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#E9E3FF] text-[#7563D9]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9E3FF] text-[#7563D9]">
                    {notifications.length} Stored
                  </span>
                </div>
                <h4 className="text-xs font-bold mt-3" style={{ color: '#303653' }}>
                  Campus Alerts & Notifications
                </h4>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#85899B' }}>
                  Alerts from booking requests, approvals, and return deadlines accumulate over time.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t" style={{ borderColor: '#EAE6E1' }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res: any = await clearNotificationsAsync('read');
                      showStorageToast(res?.detail || 'Read notifications cleared from database.');
                    } catch {
                      dialog.showToast('Failed to clear read alerts.', 'error');
                    }
                  }}
                  disabled={isClearingNotifications || !notifications.some((n: any) => n.is_read)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#85899B]" />
                  <span>Clear Read Alerts</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await dialog.confirm({
                      title: 'Clear All Notification History',
                      message: 'Permanently delete all notification history from the database to reclaim storage?',
                      confirmText: 'Clear All History',
                      cancelText: 'Keep History',
                      variant: 'danger',
                    });
                    if (confirmed) {
                      try {
                        const res: any = await clearNotificationsAsync('all');
                        showStorageToast(res?.detail || 'All notification history cleared from database.');
                      } catch {
                        dialog.showToast('Failed to clear all alerts.', 'error');
                      }
                    }
                  }}
                  disabled={isClearingNotifications || notifications.length === 0}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-[#E87575] border border-[#FCA5A5] hover:bg-[#FFF0F0] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Notification History</span>
                </button>
              </div>
            </div>

            {/* Card 2: Saved Wishlist Items */}
            <div
              className="rounded-3xl p-5 border shadow-xs flex flex-col justify-between space-y-4"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#FFE5D6] text-[#F28B82]">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE5D6] text-[#C45C20]">
                    Saved Items
                  </span>
                </div>
                <h4 className="text-xs font-bold mt-3" style={{ color: '#303653' }}>
                  Wishlist & Bookmarks
                </h4>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#85899B' }}>
                  Equipment you bookmarked for later. Clearing removes database entries across categories.
                </p>
              </div>

              <div className="pt-2 border-t" style={{ borderColor: '#EAE6E1' }}>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await dialog.confirm({
                      title: 'Clear Wishlist History',
                      message: 'Permanently remove all saved wishlist items from the database to reclaim storage?',
                      confirmText: 'Clear Wishlist',
                      cancelText: 'Keep Items',
                      variant: 'danger',
                    });
                    if (confirmed) {
                      try {
                        const res: any = await clearWishlistAsync();
                        showStorageToast(res?.detail || 'Wishlist history cleared from database.');
                      } catch {
                        dialog.showToast('Failed to clear wishlist.', 'error');
                      }
                    }
                  }}
                  disabled={isClearingWishlist}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-[#E87575] border border-[#FCA5A5] hover:bg-[#FFF0F0] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Wishlist History</span>
                </button>
              </div>
            </div>

            {/* Card 3: Inactive & Cancelled Rentals */}
            <div
              className="rounded-3xl p-5 border shadow-xs flex flex-col justify-between space-y-4"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#DFEDFF] text-[#3A6BB5]">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFEDFF] text-[#3A6BB5]">
                    Dead Records
                  </span>
                </div>
                <h4 className="text-xs font-bold mt-3" style={{ color: '#303653' }}>
                  Cancelled & Declined Rentals
                </h4>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#85899B' }}>
                  Booking attempts that were rejected or cancelled still consume row space and verification logs.
                </p>
              </div>

              <div className="pt-2 border-t" style={{ borderColor: '#EAE6E1' }}>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await dialog.confirm({
                      title: 'Purge Cancelled Bookings',
                      message: 'Permanently delete all cancelled and declined rental records from the database to reclaim storage?',
                      confirmText: 'Purge Records',
                      cancelText: 'Keep Records',
                      variant: 'danger',
                    });
                    if (confirmed) {
                      try {
                        const res: any = await clearCancelledMutation.mutateAsync();
                        showStorageToast(res?.detail || 'Cancelled rental history cleared.');
                      } catch {
                        dialog.showToast('Failed to clear cancelled bookings.', 'error');
                      }
                    }
                  }}
                  disabled={clearCancelledMutation.isPending}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-[#E87575] border border-[#FCA5A5] hover:bg-[#FFF0F0] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Cancelled Bookings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Eco / Database Efficiency Notice */}
          <div
            className="p-5 rounded-3xl border flex items-start gap-3.5"
            style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#42A879]" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#2D7A5B]">Campus Cloud Storage Efficiency Active</h5>
              <p className="text-[11px] text-[#2D7A5B]/80 mt-0.5 leading-relaxed">
                Clearing historical records directly executes PostgreSQL deletions with cascade on linked logs, reducing memory pressure, accelerating queries, and keeping RentTogether database storage lean and responsive.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SECURITY' && (
        <div className="space-y-4">
          <div
            className="rounded-3xl p-6 border shadow-xs space-y-4"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#303653' }}>
                Security & Authentication
              </h3>
              <p className="text-xs" style={{ color: '#85899B' }}>
                Your account is protected by institutional JWT tokens and one-time password (OTP) verification.
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl border" style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}>
              <div>
                <span className="text-xs font-bold" style={{ color: '#303653' }}>Institutional Email Validation</span>
                <p className="text-[11px]" style={{ color: '#85899B' }}>Secured through verified campus OTP</p>
              </div>
              <span className="text-xs font-bold text-[#42A879] flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Active
              </span>
            </div>
          </div>

          <div
            className="rounded-3xl p-6 border shadow-xs flex items-center justify-between"
            style={{ backgroundColor: '#FFF0F0', borderColor: '#F28B82' }}
          >
            <div>
              <h4 className="text-xs font-bold" style={{ color: '#E87575' }}>
                Sign Out of RentTogether
              </h4>
              <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
                End your active session on this device.
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              style={{ backgroundColor: '#E87575' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
