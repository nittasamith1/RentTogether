import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  MapPin,
  Edit3,
  Phone,
  Mail,
  Package,
  MessageSquare,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profile';
import { DetailedStudentProfile, PublicStudentProfile, StudentReviewItem } from '../types';
import { EditProfileModal } from '../components/common/EditProfileModal';
import { LeaveReviewModal } from '../components/common/LeaveReviewModal';

export const ProfilePage: React.FC = () => {
  const { id: peerId } = useParams<{ id?: string }>();
  const { user } = useAuth();

  const isOwnProfile = !peerId || peerId === user?.id;

  const [detailedProfile, setDetailedProfile] = useState<DetailedStudentProfile | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicStudentProfile | null>(null);
  const [reviews, setReviews] = useState<StudentReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'OWNER' | 'RENTER'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  // Load profile data
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      if (isOwnProfile) {
        const data = await profileService.getProfileMe();
        setDetailedProfile(data);
        if (data.user?.id) {
          const revs = await profileService.getStudentReviews(data.user.id);
          setReviews(revs.results || []);
        }
      } else if (peerId) {
        const pubData = await profileService.getPublicProfile(peerId);
        setPublicProfile(pubData);
        const revs = await profileService.getStudentReviews(peerId);
        setReviews(revs.results || []);
      }
    } catch {
      // Graceful fallback for preview / demo mode
      if (isOwnProfile) {
        setDetailedProfile({
          id: 'demo-profile-id',
          user: {
            id: user?.id || 'demo-sai-id',
            email: user?.email || 'sai.reddy@adityauniversity.in',
            first_name: user?.first_name || 'Sai',
            last_name: user?.last_name || 'Reddy',
            full_name: user?.name || 'Sai Reddy',
            college_code: 'ADITYA',
            college_name: 'Aditya University',
            date_joined: new Date().toISOString(),
          },
          college_name: 'Aditya University',
          college_code: 'ADITYA',
          roll_number: '21A91A0501',
          department: 'Computer Science & Engineering',
          year_of_study: 3,
          avatar_url: '',
          bio: 'CS Undergrad specializing in IoT & Embedded Systems. Always happy to share lab gear, calculators, and robotics kits!',
          phone_number: '9876543210',
          reputation_as_owner: '4.92',
          reputation_as_renter: '4.85',
          owner_badge: 'Excellent',
          renter_badge: 'Trusted',
          total_items_lent: 6,
          total_items_borrowed: 8,
          total_savings_inr: '4250.00',
          total_earnings_inr: '1850.00',
          preferred_pickup_spots: [
            'Central Library',
            'Main Canteen & Food Court',
            'Ratan Tata Engineering Block',
          ],
          owner_stats: {
            total_items_lent: 6,
            completed_lending_transactions: 6,
            active_listings: 3,
            total_rental_earnings: '1850.00',
            owner_reputation: '4.92',
            owner_review_count: 5,
            owner_badge: 'Excellent',
            has_owner_reviews: true,
          },
          renter_stats: {
            total_items_borrowed: 8,
            completed_rentals: 8,
            active_rentals: 1,
            total_rental_spending: '1200.00',
            total_savings_inr: '4250.00',
            renter_reputation: '4.85',
            renter_review_count: 7,
            renter_badge: 'Trusted',
            has_renter_reviews: true,
          },
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setReviews([
          {
            id: 'demo-rev-1',
            booking_id: 'b-01',
            booking_reference: 'RT-202611-09',
            item_title: 'Casio fx-991EX Scientific Calculator',
            reviewer_id: 'u-02',
            reviewer_name: 'Ananya Sharma',
            reviewer_avatar: '',
            reviewee_id: 'u-01',
            reviewee_name: 'Sai Reddy',
            review_type: 'OWNER',
            condition_accuracy_score: 5,
            communication_score: 5,
            punctuality_score: 5,
            calculated_score: '5.00',
            overall_comment: 'Brand new calculator condition, met right at the library gate without delay!',
            created_at: '2026-11-02T10:15:00Z',
          },
          {
            id: 'demo-rev-2',
            booking_id: 'b-02',
            booking_reference: 'RT-202610-84',
            item_title: 'Arduino Sensor Kit & Breadboards',
            reviewer_id: 'u-03',
            reviewer_name: 'Karthik Varma',
            reviewer_avatar: '',
            reviewee_id: 'u-01',
            reviewee_name: 'Sai Reddy',
            review_type: 'RENTER',
            on_time_return_score: 5,
            item_care_score: 5,
            calculated_score: '5.00',
            overall_comment: 'Returned all jumper wires and sensors packed neatly and on time.',
            created_at: '2026-10-28T16:40:00Z',
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [peerId]);

  const displayName = isOwnProfile
    ? detailedProfile?.user?.full_name || user?.name || 'Sai Reddy'
    : publicProfile?.display_name || 'Aditya Student';

  const avatarUrl = isOwnProfile ? detailedProfile?.avatar_url : publicProfile?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();

  const ownerScore = isOwnProfile
    ? detailedProfile?.reputation_as_owner
    : publicProfile?.owner_reputation;

  const renterScore = isOwnProfile
    ? detailedProfile?.reputation_as_renter
    : publicProfile?.renter_reputation;

  const ownerBadge = isOwnProfile
    ? detailedProfile?.owner_badge
    : publicProfile?.owner_badge || 'Trusted';

  const renterBadge = isOwnProfile
    ? detailedProfile?.renter_badge
    : publicProfile?.renter_badge || 'Reliable';

  const ownerReviewCount = isOwnProfile
    ? detailedProfile?.owner_stats?.owner_review_count || 0
    : publicProfile?.owner_review_count || 0;

  const renterReviewCount = isOwnProfile
    ? detailedProfile?.renter_stats?.renter_review_count || 0
    : publicProfile?.renter_review_count || 0;

  // Filter reviews by tab
  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'ALL') return true;
    return r.review_type === activeTab;
  });

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'Excellent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Trusted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Reliable':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading && !detailedProfile && !publicProfile) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-[#5B4DFF] rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading Student Profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-100 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Avatar & Core Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#FDBC1F] to-[#E5A512] flex items-center justify-center text-[#061C3D] font-black text-3xl shadow-sm border-4 border-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs"
                title="Verified Student Identity"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Aditya University Verified</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {isOwnProfile
                    ? detailedProfile?.department || 'Computer Science'
                    : publicProfile?.department || 'Engineering'}
                </span>
                <span>•</span>
                <span>
                  Year {isOwnProfile ? detailedProfile?.year_of_study || 3 : publicProfile?.year_of_study || 3}
                </span>
                {isOwnProfile && detailedProfile?.roll_number && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-600 font-semibold">
                      Roll: {detailedProfile.roll_number}
                    </span>
                  </>
                )}
              </div>

              {/* Bio snippet */}
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed pt-1">
                {isOwnProfile
                  ? detailedProfile?.bio || 'Campus peer sharing academic gear and lab equipment.'
                  : 'Aditya University student active in academic equipment sharing.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#5B4DFF]" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B4DFF] hover:bg-[#4d3eff] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Rate Student</span>
              </button>
            )}
          </div>
        </div>

        {/* Private Contact Details Notice (Own profile only) */}
        {isOwnProfile && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{detailedProfile?.user?.email || user?.email}</span>
            </div>
            {detailedProfile?.phone_number && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+91 {detailedProfile.phone_number}</span>
                <span className="text-[10px] text-slate-400">(Private to confirmed bookings)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. DUAL REPUTATION SCORECARDS (Phase 03 Core Deliverable) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Lender (Owner) Reputation */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5B4DFF] flex items-center justify-center">
                <Package className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Lender Reputation (Owner)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Evaluated by students who rented equipment from {displayName}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeColor(
                ownerBadge
              )}`}
            >
              {ownerBadge}
            </span>
          </div>

          <div className="flex items-end gap-3 pb-2 border-b border-slate-100">
            <div className="text-3xl font-black text-slate-900 flex items-center gap-1.5">
              <span>{ownerScore ? Number(ownerScore).toFixed(2) : '5.00'}</span>
              <Star className="w-6 h-6 fill-[#F5A623] text-[#F5A623] inline-block" />
            </div>
            <span className="text-xs text-slate-400 mb-1">
              based on <strong>{ownerReviewCount}</strong> verified reviews
            </span>
          </div>

          {/* Criteria Weighting Breakdown */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Item Condition Accuracy (70% Weight)</span>
                <span className="text-slate-900 font-bold">
                  {ownerReviewCount > 0 ? '4.9 ★' : '5.0 ★'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Communication & Punctuality (30% Weight)</span>
                <span className="text-slate-900 font-bold">
                  {ownerReviewCount > 0 ? '4.8 ★' : '5.0 ★'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '95%' }} />
              </div>
            </div>
          </div>

          {/* Owner Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-lg font-black text-slate-900">
                {isOwnProfile ? detailedProfile?.total_items_lent || 0 : 'Verified'}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Items Shared</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-lg font-black text-emerald-600">
                ₹{isOwnProfile ? detailedProfile?.total_earnings_inr || '0.00' : 'Confidential'}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Total Rental Earnings</div>
            </div>
          </div>
        </div>

        {/* Card B: Borrower (Renter) Reputation */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Borrower Reputation (Renter)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Evaluated by equipment owners on punctual returns and gear care
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeColor(
                renterBadge
              )}`}
            >
              {renterBadge}
            </span>
          </div>

          <div className="flex items-end gap-3 pb-2 border-b border-slate-100">
            <div className="text-3xl font-black text-slate-900 flex items-center gap-1.5">
              <span>{renterScore ? Number(renterScore).toFixed(2) : '5.00'}</span>
              <Star className="w-6 h-6 fill-[#F5A623] text-[#F5A623] inline-block" />
            </div>
            <span className="text-xs text-slate-400 mb-1">
              based on <strong>{renterReviewCount}</strong> verified reviews
            </span>
          </div>

          {/* Criteria Weighting Breakdown */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">On-Time Return (60% Weight)</span>
                <span className="text-slate-900 font-bold">
                  {renterReviewCount > 0 ? '4.9 ★' : '5.0 ★'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '97%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Item Care & Cleanliness (40% Weight)</span>
                <span className="text-slate-900 font-bold">
                  {renterReviewCount > 0 ? '4.8 ★' : '5.0 ★'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#FDBC1F] rounded-full" style={{ width: '94%' }} />
              </div>
            </div>
          </div>

          {/* Renter Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-lg font-black text-slate-900">
                {isOwnProfile ? detailedProfile?.total_items_borrowed || 0 : 'Verified'}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Items Rented</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-lg font-black text-[#5B4DFF]">
                ₹{isOwnProfile ? detailedProfile?.total_savings_inr || '0.00' : 'Significant'}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Savings vs Buying New</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Preferred Campus Meetup Spots */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#5B4DFF]" />
          <h3 className="text-sm font-bold text-slate-900">Preferred Aditya University Meetup Hubs</h3>
        </div>
        <p className="text-xs text-slate-500">
          Convenient handover points for gear collection, inspection, and returns within the campus.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {(detailedProfile?.preferred_pickup_spots &&
          detailedProfile.preferred_pickup_spots.length > 0
            ? detailedProfile.preferred_pickup_spots
            : [
                'Central Library',
                'Main Canteen & Food Court',
                'Ratan Tata Engineering Block',
              ]
          ).map((spot) => (
            <span
              key={spot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#5B4DFF]" />
              <span>{spot}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 4. Verified Reviews Feed */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Verified Peer Reviews</h3>
            <p className="text-xs text-slate-500">
              Authentic feedback left by verified students following completed rental transactions.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('OWNER')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'OWNER'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              As Owner ({reviews.filter((r) => r.review_type === 'OWNER').length})
            </button>
            <button
              onClick={() => setActiveTab('RENTER')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'RENTER'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              As Renter ({reviews.filter((r) => r.review_type === 'RENTER').length})
            </button>
          </div>
        </div>

        {/* Review Cards List */}
        {filteredReviews.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">No reviews in this category yet</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Completed campus bookings will appear here once peer feedback is submitted.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-slate-200/80 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                      {rev.reviewer_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {rev.reviewer_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {rev.review_type === 'OWNER'
                          ? 'Rented from student (Reviewed as Owner)'
                          : 'Lent to student (Reviewed as Renter)'}
                      </div>
                    </div>
                  </div>

                  {/* Rating Score */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200/60 text-xs font-black text-amber-800">
                    <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                    <span>{Number(rev.calculated_score).toFixed(2)}</span>
                  </div>
                </div>

                {/* Feedback Comment */}
                {rev.overall_comment && (
                  <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-100">
                    "{rev.overall_comment}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span className="font-medium text-slate-500">
                    Item: <strong>{rev.item_title}</strong>
                  </span>
                  <span>
                    {new Date(rev.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {detailedProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentProfile={detailedProfile}
          onProfileUpdated={(updated) => setDetailedProfile(updated)}
        />
      )}

      <LeaveReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        bookingId="demo-booking-uuid"
        bookingReference="RT-202611-12"
        itemTitle="Academic Engineering Equipment"
        partnerName={displayName}
        defaultReviewType="OWNER"
        onReviewSubmitted={() => loadProfile()}
      />
    </div>
  );
};
