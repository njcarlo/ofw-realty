export class CreateUnitDto {
  unit_type!: string
  identifier!: string
  floor_area_sqm!: number
  price_php!: number
  floor_plan_url?: string
  status?: 'available' | 'reserved' | 'sold'
}
