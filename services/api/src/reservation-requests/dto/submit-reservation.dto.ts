export class SubmitReservationDto {
  unit_id!: string
  connection_id!: string
  buyer_name!: string
  buyer_contact!: string
  reservation_fee_confirmed!: boolean
  response_window_hours?: number
}
