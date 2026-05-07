import { z } from 'zod'

export const CreateListingSchema = z.object({
  property_type: z.enum(['residential_lot','house_and_lot','condo','commercial','farm_lot']),
  listing_type: z.enum(['sale', 'rent']).default('sale'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  price_php: z.number().positive('Price must be positive'),
  lat: z.number().min(-90).max(90, 'Invalid latitude'),
  lng: z.number().min(-180).max(180, 'Invalid longitude'),
  lot_area_sqm: z.number().positive().optional(),
  floor_area_sqm: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  parking_slots: z.number().int().min(0).max(10).optional(),
  furnishing: z.enum(['unfurnished', 'semi_furnished', 'fully_furnished']).optional(),
  amenities: z.array(z.string()).optional(),
  block_number: z.string().optional(),
  lot_number: z.string().optional(),
  tct_number: z.string().optional(),
  tax_declaration_no: z.string().optional(),
  address: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  barangay: z.string().optional(),
  description: z.string().optional(),
  photo_urls: z.array(z.string().url()).min(1, 'At least one photo is required'),
  boundary_geojson: z.any().optional(),
})
export type CreateListingDto = z.infer<typeof CreateListingSchema>

export const UpdateListingSchema = CreateListingSchema.partial().extend({
  status: z.enum(['active', 'reserved', 'sold', 'deactivated']).optional(),
})
export type UpdateListingDto = z.infer<typeof UpdateListingSchema>
