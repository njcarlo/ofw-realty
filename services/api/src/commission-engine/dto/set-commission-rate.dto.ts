export class SetCommissionRateDto {
  connection_id?: string
  rate_type!: 'percentage' | 'fixed_php'
  rate_value!: number
}
