export class SetDefaultRateDto {
  rate_type!: 'percentage' | 'fixed_php'
  rate_value!: number
}
