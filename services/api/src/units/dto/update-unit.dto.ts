export class UpdateUnitDto {
  price_php?: number
  status?: 'available' | 'reserved' | 'sold'
  floor_plan_url?: string
}
