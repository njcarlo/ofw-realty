export class AddPromoRateDto {
  rate_type!: 'percentage' | 'fixed_php'
  rate_value!: number
  promo_start!: string  // ISO date string
  promo_end!: string    // ISO date string
}
