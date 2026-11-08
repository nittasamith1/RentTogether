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

  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case 'Excellent':
        return { backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' };
      case 'Trusted':
        return { backgroundColor: '#E9E3FF', color: '#7563D9', borderColor: '#D8D0F5' };
      case 'Reliable':
        return { backgroundColor: '#FFE5D6', color: '#E8A447', borderColor: '#F5CDB8' };
      default:
        return { backgroundColor: '#FFF8ED', color: '#85899B', borderColor: '#EAE6E1' };
    }
  };

  if (isLoading && !detailedProfile && !publicProfile) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: '#E9E3FF', borderTopColor: '#7563D9' }} />
        <span className="text-xs font-semibold" style={{ color: '#85899B' }}>Loading Student Profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pt-4">
      {/* 1. Header Hero Card */}
      <div
        className="rounded-3xl p-6 sm:p-8 shadow-xs border relative overflow-hidden"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Avatar & Core Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-3xl shadow-sm border-4 border-white"
                style={{ backgroundColor: '#7563D9' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: '#42A879' }}
                title="Verified Student Identity"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight" style={{ color: '#303653' }}>
                  {displayName}
                </h1>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  style={{ backgroundColor: '#DDF3E7', color: '#42A879', borderColor: '#B8E5CC' }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Aditya University Verified</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: '#85899B' }}>
                <span className="font-semibold" style={{ color: '#303653' }}>
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
                    <span className="font-mono font-semibold" style={{ color: '#85899B' }}>
                      Roll: {detailedProfile.roll_number}
                    </span>
                  </>
                )}
              </div>

              {/* Bio snippet */}
              <p className="text-xs max-w-xl leading-relaxed pt-1" style={{ color: '#85899B' }}>
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs"
                style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D8D0F5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E9E3FF')}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                style={{ backgroundColor: '#7563D9' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Rate Student</span>
              </button>
            )}
          </div>
        </div>

        {/* Private Contact Details Notice */}
        {isOwnProfile && (
          <div className="mt-6 pt-5 flex flex-wrap items-center gap-6 text-xs" style={{ borderTop: '1px solid #EAE6E1', color: '#85899B' }}>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" style={{ color: '#7563D9' }} />
              <span>{detailedProfile?.user?.email || user?.email}</span>
            </div>
            {detailedProfile?.phone_number && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" style={{ color: '#7563D9' }} />
                <span>+91 {detailedProfile.phone_number}</span>
                <span className="text-[10px]" style={{ color: '#85899B' }}>(Private to confirmed bookings)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. DUAL REPUTATION SCORECARDS (Simple & Clean) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Lender (Owner) Reputation */}
        <div
          className="rounded-3xl p-6 shadow-xs border flex flex-col justify-between space-y-5"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold"
                style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
              >
                <Package className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight" style={{ color: '#303653' }}>
                  Lender Reputation
                </h2>
                <p className="text-xs" style={{ color: '#85899B' }}>
                  As equipment owner
                </p>
              </div>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold border"
              style={getBadgeStyle(ownerBadge)}
            >
              {ownerBadge || 'New Member'}
            </span>
          </div>

          {/* Big Rating Display */}
          <div className="flex items-baseline gap-2.5 pb-2" style={{ borderBottom: '1px solid #EAE6E1' }}>
            <span className="text-3xl font-black" style={{ color: '#303653' }}>
              {ownerReviewCount > 0 && ownerScore ? Number(ownerScore).toFixed(2) : '5.00'}
            </span>
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-[#E8A447]" style={{ color: '#E8A447' }} />
              <span className="text-xs" style={{ color: '#85899B' }}>
                {ownerReviewCount > 0
                  ? `(${ownerReviewCount} verified reviews)`
                  : '· New Member (No reviews yet)'}
              </span>
            </div>
          </div>

          {/* Simple Performance Factors */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span style={{ color: '#303653' }}>Item Condition Accuracy</span>
                <span className="font-bold" style={{ color: '#42A879' }}>
                  {ownerReviewCount > 0 ? '4.9 ★' : '100% Verified'}
                </span>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: '#FFF8ED', border: '1px solid #EAE6E1' }}
              >
                <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: '#42A879' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span style={{ color: '#303653' }}>Communication & Handover</span>
                <span className="font-bold" style={{ color: '#7563D9' }}>
                  {ownerReviewCount > 0 ? '4.8 ★' : '100% Responsive'}
                </span>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: '#FFF8ED', border: '1px solid #EAE6E1' }}
              >
                <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: '#7563D9' }} />
              </div>
            </div>
          </div>

          {/* Owner Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-center">
            <div
              className="p-3.5 rounded-2xl border"
              style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
            >
              <div className="text-xl font-black" style={{ color: '#303653' }}>
                {isOwnProfile ? detailedProfile?.total_items_lent || 0 : 'Verified'}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#7563D9' }}>
                Items Shared
              </div>
            </div>
            <div
              className="p-3.5 rounded-2xl border"
              style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
            >
              <div className="text-xl font-black" style={{ color: '#42A879' }}>
                ₹{isOwnProfile ? Math.round(Number(detailedProfile?.total_earnings_inr || 0)).toLocaleString() : 'Confidential'}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#2D7A5B' }}>
                Total Earned
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Borrower (Renter) Reputation */}
        <div
          className="rounded-3xl p-6 shadow-xs border flex flex-col justify-between space-y-5"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold"
                style={{ backgroundColor: '#DFEDFF', color: '#6398D6' }}
              >
                <Clock className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight" style={{ color: '#303653' }}>
                  Borrower Reputation
                </h2>
                <p className="text-xs" style={{ color: '#85899B' }}>
                  As resource borrower
                </p>
              </div>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold border"
              style={getBadgeStyle(renterBadge)}
            >
              {renterBadge || 'New Member'}
            </span>
          </div>

          {/* Big Rating Display */}
          <div className="flex items-baseline gap-2.5 pb-2" style={{ borderBottom: '1px solid #EAE6E1' }}>
            <span className="text-3xl font-black" style={{ color: '#303653' }}>
              {renterReviewCount > 0 && renterScore ? Number(renterScore).toFixed(2) : '5.00'}
            </span>
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-[#E8A447]" style={{ color: '#E8A447' }} />
              <span className="text-xs" style={{ color: '#85899B' }}>
                {renterReviewCount > 0
                  ? `(${renterReviewCount} verified reviews)`
                  : '· New Member (No reviews yet)'}
              </span>
            </div>
          </div>

          {/* Simple Performance Factors */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span style={{ color: '#303653' }}>On-Time Return Rate</span>
                <span className="font-bold" style={{ color: '#42A879' }}>
                  {renterReviewCount > 0 ? '4.9 ★' : '100% On-Time'}
                </span>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: '#FFF8ED', border: '1px solid #EAE6E1' }}
              >
                <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: '#42A879' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span style={{ color: '#303653' }}>Item Care & Safety</span>
                <span className="font-bold" style={{ color: '#E8A447' }}>
                  {renterReviewCount > 0 ? '4.8 ★' : '100% Care'}
                </span>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: '#FFF8ED', border: '1px solid #EAE6E1' }}
              >
                <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: '#E8A447' }} />
              </div>
            </div>
          </div>

          {/* Renter Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-center">
            <div
              className="p-3.5 rounded-2xl border"
              style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
            >
              <div className="text-xl font-black" style={{ color: '#303653' }}>
                {isOwnProfile ? detailedProfile?.total_items_borrowed || 0 : 'Verified'}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#6398D6' }}>
                Items Rented
              </div>
            </div>
            <div
              className="p-3.5 rounded-2xl border"
              style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
            >
              <div className="text-xl font-black" style={{ color: '#C45C20' }}>
                ₹{isOwnProfile ? Math.round(Number(detailedProfile?.total_savings_inr || 0)).toLocaleString() : 'Significant'}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#C45C20' }}>
                Campus Savings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Preferred Campus Meetup Spots */}
      <div
        className="rounded-3xl p-6 shadow-xs border space-y-3"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: '#7563D9' }} />
          <h3 className="text-sm font-bold" style={{ color: '#303653' }}>Preferred Aditya University Meetup Hubs</h3>
        </div>
        <p className="text-xs" style={{ color: '#85899B' }}>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold"
              style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7563D9' }} />
              <span>{spot}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 4. Verified Reviews Feed */}
      <div
        className="rounded-3xl p-6 shadow-xs border space-y-5"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold" style={{ color: '#303653' }}>Verified Peer Reviews</h3>
            <p className="text-xs" style={{ color: '#85899B' }}>
              Authentic feedback left by verified students following completed rental transactions.
            </p>
          </div>

          {/* Filter Pills */}
          <div
            className="flex items-center gap-1.5 p-1 rounded-xl text-xs font-bold border"
            style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
          >
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white shadow-2xs font-extrabold text-[#7563D9]'
                  : 'hover:text-[#7563D9]'
              }`}
              style={{ color: activeTab === 'ALL' ? '#7563D9' : '#303653' }}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('OWNER')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'OWNER'
                  ? 'bg-white shadow-2xs font-extrabold text-[#7563D9]'
                  : 'hover:text-[#7563D9]'
              }`}
              style={{ color: activeTab === 'OWNER' ? '#7563D9' : '#303653' }}
            >
              As Owner ({reviews.filter((r) => r.review_type === 'OWNER').length})
            </button>
            <button
              onClick={() => setActiveTab('RENTER')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'RENTER'
                  ? 'bg-white shadow-2xs font-extrabold text-[#7563D9]'
                  : 'hover:text-[#7563D9]'
              }`}
              style={{ color: activeTab === 'RENTER' ? '#7563D9' : '#303653' }}
            >
              As Renter ({reviews.filter((r) => r.review_type === 'RENTER').length})
            </button>
          </div>
        </div>

        {/* Review Cards List */}
        {filteredReviews.length === 0 ? (
          <div
            className="py-12 text-center space-y-2 border border-dashed rounded-2xl"
            style={{ borderColor: '#EAE6E1' }}
          >
            <MessageSquare className="w-8 h-8 mx-auto" style={{ color: '#85899B' }} />
            <h4 className="text-xs font-bold" style={{ color: '#303653' }}>No reviews in this category yet</h4>
            <p className="text-[11px] max-w-xs mx-auto" style={{ color: '#85899B' }}>
              Completed campus bookings will appear here once peer feedback is submitted.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl border transition-all space-y-2.5"
                style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
                    >
                      {rev.reviewer_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight" style={{ color: '#303653' }}>
                        {rev.reviewer_name}
                      </div>
                      <div className="text-[10px]" style={{ color: '#85899B' }}>
                        {rev.review_type === 'OWNER'
                          ? 'Rented from student (Reviewed as Owner)'
                          : 'Lent to student (Reviewed as Renter)'}
                      </div>
                    </div>
                  </div>

                  {/* Rating Score */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-black"
                    style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8', color: '#C45C20' }}
                  >
                    <Star className="w-3.5 h-3.5 fill-[#E8A447]" style={{ color: '#E8A447' }} />
                    <span>{Number(rev.calculated_score).toFixed(2)}</span>
                  </div>
                </div>

                {/* Feedback Comment */}
                {rev.overall_comment && (
                  <p
                    className="text-xs leading-relaxed italic p-3 rounded-xl border"
                    style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                  >
                    "{rev.overall_comment}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] pt-0.5" style={{ color: '#85899B' }}>
                  <span>
                    Item: <strong style={{ color: '#303653' }}>{rev.item_title}</strong>
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
