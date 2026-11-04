// ==============================================================================
// Core Domain Types for RentTogether
// ==============================================================================

export interface College {
  id: string;
  name: string;
  code: string;
  domain_whitelist: string[];
  address?: string;
  is_active: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  college_code: string;
  college_name: string;
  email_verified: boolean;
  is_college_verified: boolean;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_SUBMITTED';
  is_staff?: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  is_college_verified: boolean;
  college?: College | null;
  date_joined: string;
}

export interface OwnerStats {
  total_items_lent: number;
  completed_lending_transactions: number;
  active_listings: number;
  total_rental_earnings: number | string;
  owner_reputation: number | string | null;
  owner_review_count: number;
  owner_badge: string;
  has_owner_reviews: boolean;
}

export interface RenterStats {
  total_items_borrowed: number;
  completed_rentals: number;
  active_rentals: number;
  total_rental_spending: number | string;
  total_savings_inr: number | string;
  renter_reputation: number | string | null;
  renter_review_count: number;
  renter_badge: string;
  has_renter_reviews: boolean;
}

export interface DetailedStudentProfile {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    college_code: string;
    college_name: string;
    date_joined: string;
  };
  college_name: string;
  college_code: string;
  roll_number: string;
  department: string;
  year_of_study: number;
  avatar?: string | null;
  avatar_url: string;
  bio: string;
  phone_number: string;
  reputation_as_owner: number | string;
  reputation_as_renter: number | string;
  owner_badge: string;
  renter_badge: string;
  total_items_lent: number;
  total_items_borrowed: number;
  total_savings_inr: number | string;
  total_earnings_inr: number | string;
  preferred_pickup_spots: string[];
  owner_stats: OwnerStats;
  renter_stats: RenterStats;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicStudentProfile {
  id: string;
  display_name: string;
  avatar_url: string;
  college_name: string;
  college_code: string;
  department: string;
  year_of_study: number;
  is_verified: boolean;
  owner_reputation: number | null;
  owner_badge: string;
  owner_review_count: number;
  renter_reputation: number | null;
  renter_badge: string;
  renter_review_count: number;
  total_completed_rentals: number;
  member_since: string;
  recent_reviews: StudentReviewItem[];
}

export interface StudentReviewItem {
  id: string;
  booking_id: string;
  booking_reference: string;
  item_title: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string;
  reviewee_id: string;
  reviewee_name: string;
  review_type: 'OWNER' | 'RENTER';
  condition_accuracy_score?: number | null;
  communication_score?: number | null;
  punctuality_score?: number | null;
  on_time_return_score?: number | null;
  item_care_score?: number | null;
  calculated_score: number | string;
  overall_comment: string;
  created_at: string;
}

export interface StudentReviewCreatePayload {
  booking_id: string;
  review_type: 'OWNER' | 'RENTER';
  condition_accuracy_score?: number;
  communication_score?: number;
  punctuality_score?: number;
  on_time_return_score?: number;
  item_care_score?: number;
  overall_comment?: string;
}

export interface StudentProfileUpdatePayload {
  bio?: string;
  phone_number?: string;
  avatar?: File;
  preferred_pickup_spots?: string[];
}

export interface StudentVerification {
  id: string;
  user_email: string;
  student_name: string;
  college_code: string;
  college_name: string;
  roll_number: string;
  department: string;
  year_of_study: number;
  id_card_image?: string | null;
  id_card_url?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejection_reason?: string;
  submitted_at: string;
  verified_at?: string | null;
  verified_by_name?: string;
  updated_at?: string;
}

export interface HealthResponse {
  status: string;
  database: string;
  database_engine: string;
  version: string;
  timestamp: string;
  college_count: number;
  default_college?: {
    name: string;
    code: string;
  } | null;
}
