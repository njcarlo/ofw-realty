import { z } from 'zod'

// ─── Listing Schemas ───────────────────────────────────────────
export const PropertyTypeSchema = z.enum([
  'residential_lot', 'house_and_lot', 'condo', 'commercial', 'farm_lot'
])
export type PropertyType = z.infer<typeof PropertyTypeSchema>

export const ListingStatusSchema = z.enum(['active', 'reserved', 'sold', 'deactivated'])
export type ListingStatus = z.infer<typeof ListingStatusSchema>

export const ListingSchema = z.object({
  id: z.string().uuid(),
  realtor_id: z.string().uuid().nullable(),
  brokerage_id: z.string().uuid().nullable(),
  property_type: PropertyTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  price_php: z.number().positive(),
  lat: z.number(),
  lng: z.number(),
  address: z.string().nullable(),
  province: z.string().nullable(),
  city: z.string().nullable(),
  barangay: z.string().nullable(),
  lot_area_sqm: z.number().nullable(),
  block_number: z.string().nullable(),
  lot_number: z.string().nullable(),
  status: ListingStatusSchema,
  is_featured: z.boolean(),
  blockchain_verified: z.boolean(),
  scam_flagged: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Listing = z.infer<typeof ListingSchema>

export const CreateListingSchema = z.object({
  property_type: PropertyTypeSchema,
  title: z.string().min(5),
  price_php: z.number().positive(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  lot_area_sqm: z.number().positive().optional(),
  block_number: z.string().optional(),
  lot_number: z.string().optional(),
  address: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  barangay: z.string().optional(),
  description: z.string().optional(),
})
export type CreateListingDto = z.infer<typeof CreateListingSchema>

// ─── Map Schemas ───────────────────────────────────────────────
export const MapPinSchema = z.object({
  id: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
  price_php: z.number(),
  property_type: PropertyTypeSchema,
  is_featured: z.boolean(),
  blockchain_verified: z.boolean(),
  scam_flagged: z.boolean(),
})
export type MapPin = z.infer<typeof MapPinSchema>

export const BoundingBoxSchema = z.object({
  minLat: z.number(),
  maxLat: z.number(),
  minLng: z.number(),
  maxLng: z.number(),
})
export type BoundingBox = z.infer<typeof BoundingBoxSchema>

// ─── Inquiry Schemas ───────────────────────────────────────────
export const InquiryStatusSchema = z.enum(['pending', 'responded', 'closed'])

export const CreateInquirySchema = z.object({
  listing_id: z.string().uuid(),
  message: z.string().min(10),
  offer_price_php: z.number().positive().optional(),
})
export type CreateInquiryDto = z.infer<typeof CreateInquirySchema>

// ─── Commission Schemas ────────────────────────────────────────
export const CommissionRateTypeSchema = z.enum(['percentage', 'fixed'])

export const CreateCommissionRateSchema = z.object({
  brokerage_id: z.string().uuid(),
  realtor_id: z.string().uuid().optional(),
  property_type: PropertyTypeSchema.optional(),
  rate_type: CommissionRateTypeSchema,
  rate_value: z.number().positive(),
  is_default: z.boolean().default(false),
})
export type CreateCommissionRateDto = z.infer<typeof CreateCommissionRateSchema>

// ─── Pre-Qualification Schemas ─────────────────────────────────
export const PreQualInputSchema = z.object({
  monthly_gross_income: z.number().positive(),
  existing_monthly_debts: z.number().min(0),
  age: z.number().int().min(18).max(65),
  employment_type: z.enum(['ofw', 'local_employed', 'self_employed']),
})
export type PreQualInput = z.infer<typeof PreQualInputSchema>

export interface PreQualResult {
  pagibig_max_loan: number
  bank_max_loan: number
  inhouse_max_loan: number
  breakdown: {
    income_basis: number
    debt_deductions: number
    pagibig_ratio: number
    bank_ratio: number
  }
  disclaimer: string
}

// ─── Typed API fetch helper ────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message ?? 'API request failed')
  }
  return res.json()
}
