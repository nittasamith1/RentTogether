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
