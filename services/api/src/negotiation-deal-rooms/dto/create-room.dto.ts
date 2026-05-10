export class CreateRoomDto {
  listing_id!: string
  amount_php!: number
  payment_method!: 'cash' | 'bank_financing' | 'pag_ibig' | 'in_house'
  conditions?: string
}
