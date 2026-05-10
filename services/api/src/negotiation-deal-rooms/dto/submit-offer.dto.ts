export class SubmitOfferDto {
  offer_type!: 'offer' | 'counter_offer'
  amount_php!: number
  payment_method?: 'cash' | 'bank_financing' | 'pag_ibig' | 'in_house'
  conditions?: string
  response_to_offer_id?: string
  response?: 'accepted' | 'declined' | 'countered'
}
