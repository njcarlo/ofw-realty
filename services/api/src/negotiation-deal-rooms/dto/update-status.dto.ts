export class UpdateStatusDto {
  status!: 'active' | 'offer_accepted' | 'reserved' | 'closed' | 'cancelled'
}
