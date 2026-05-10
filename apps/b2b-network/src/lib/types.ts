export interface B2BProfile {
  id: string
  user_id: string
  broker_company_id?: string
  display_name: string
  headline?: string
  bio?: string
  avatar_url?: string
  cover_url?: string
  location?: string
  years_experience?: number
  specializations?: string[]
  languages?: string[]
  website_url?: string
  social_links?: Record<string, string>
  prc_license_number?: string
  prc_license_type?: 'broker' | 'salesperson' | 'appraiser'
  prc_verified: boolean
  prc_verified_at?: string
  connection_count: number
  listing_count: number
  post_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface B2BPost {
  id: string
  author_id: string
  content: string
  media_urls?: string[]
  post_type: 'update' | 'listing_share' | 'service_offer' | 'market_insight' | 'co_broking_request'
  listing_id?: string
  visibility: 'public' | 'network' | 'connections_only'
  reaction_count: number
  comment_count: number
  share_count: number
  is_pinned: boolean
  created_at: string
  author?: B2BProfile
  listing?: {
    id: string
    title: string
    price_php: number
    city: string
    province: string
    property_type: string
    lot_area_sqm?: number
    listing_photos?: { url: string; is_primary: boolean }[]
  }
  user_reaction?: string | null
}

export interface B2BConnection {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn'
  message?: string
  created_at: string
  profile?: B2BProfile
}

export interface B2BServiceOffer {
  id: string
  profile_id: string
  title: string
  description: string
  service_type: string
  coverage_areas?: string[]
  fee_type?: 'fixed' | 'percentage' | 'negotiable' | 'free'
  fee_amount?: number
  is_active: boolean
  created_at: string
  profile?: B2BProfile
}

export interface B2BListingShare {
  id: string
  profile_id: string
  listing_id: string
  co_broke: boolean
  commission_split?: number
  note?: string
  created_at: string
  profile?: B2BProfile
  listing?: B2BPost['listing']
}
