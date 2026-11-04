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

export interface StudentProfile {
  id: string;
  user: User;
  college?: College | null;
  roll_number?: string;
  department?: string;
  year_of_study?: number;
  avatar_url?: string;
  bio?: string;
  phone_number?: string;
  reputation_as_owner: number;
  reputation_as_renter: number;
  total_savings: number;
  total_earnings: number;
  is_verified: boolean;
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
