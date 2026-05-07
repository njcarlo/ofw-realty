/**
 * Shared entity interfaces for the Services Portal.
 * These mirror the DB schema defined in migration 015_services_portal.sql.
 */

export type LicenseVerificationStatus =
  | 'not_applicable'
  | 'verified'
  | 'unverified_manual'
  | 'failed'

export type ProviderStatus = 'pending_review' | 'approved' | 'rejected' | 'suspended'

export type AvailabilityStatus = 'available' | 'busy'

export type ServiceType =
  | 'property_appraisal'
  | 'geodetic_survey'
  | 'title_transfer'
  | 'notarization'
  | 'legal_consultation'
  | 'property_tax_assistance'
  | 'building_permit_processing'
  | 'other'

export type ServiceRequestStatus =
  | 'open'
  | 'in_progress'
  | 'expired'
  | 'completed'
  | 'cancelled'

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export type EngagementStatus = 'active' | 'completed' | 'disputed' | 'cancelled'

// ---------------------------------------------------------------------------
// Entity interfaces
// ---------------------------------------------------------------------------

export interface ProviderProfile {
  id: string
  user_id: string
  full_name: string
  license_number: string | null
  license_type: 'prc' | 'dti' | null
  license_verification_status: LicenseVerificationStatus
  prc_lookup_result: Record<string, unknown> | null
  service_types: ServiceType[]
  coverage_areas: string[]
  bio: string | null
  contact_phone: string | null
  contact_email: string | null
  photo_url: string | null
  availability: AvailabilityStatus
  status: ProviderStatus
  rejection_reason: string | null
  is_featured: boolean
  featured_until: string | null
  avg_rating: number | null
  completed_engagements: number
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface ServiceRequest {
  id: string
  requester_id: string
  service_type: ServiceType
  other_description: string | null
  description: string
  province: string
  city: string
  barangay: string | null
  preferred_timeline: string | null
  budget_min_php: number | null
  budget_max_php: number | null
  status: ServiceRequestStatus
  proposal_count: number
  expires_at: string
  extension_granted: boolean
  created_at: string
  updated_at: string
}

export interface Proposal {
  id: string
  request_id: string
  provider_id: string
  message: string
  fee_min_php: number | null
  fee_max_php: number | null
  estimated_timeline: string
  status: ProposalStatus
  created_at: string
  updated_at: string
}

export interface Engagement {
  id: string
  request_id: string
  proposal_id: string
  requester_id: string
  provider_id: string
  status: EngagementStatus
  requester_completed_at: string | null
  provider_completed_at: string | null
  auto_completed_at: string | null
  dispute_raised_by: string | null
  dispute_raised_at: string | null
  resolution_note: string | null
  resolved_by: string | null
  resolved_at: string | null
  rating_window_closes_at: string | null
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  engagement_id: string
  requester_id: string
  provider_id: string
  score: number
  review: string | null
  created_at: string
}

export interface EngagementMessage {
  id: string
  engagement_id: string
  sender_id: string
  content: string
  created_at: string
}
