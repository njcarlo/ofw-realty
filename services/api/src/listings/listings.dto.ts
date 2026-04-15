import { z } from 'zod'

export const CreateListingSchema = z.object({
  property_type: z.enum(['residential_lot','house_and_lot','condo','commercial','farm_lot']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  price_php: z.number().positive('Price must be positive'),
  lat: z.number().min(-90).max(90, 'Invalid latitude'),
  lng: z.number().min(-180).max(180, 'Invalid longitude'),
  lot_area_sqm: z.number().positive().optional(),
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
})
export type CreateListingDto = z.infer<typeof CreateListingSchema>

export const UpdateListingSchema = CreateListingSchema.partial().extend({
  status: z.enum(['active', 'reserved', 'sold', 'deactivated']).optional(),
})
export type UpdateListingDto = z.infer<typeof UpdateListingSchema>
