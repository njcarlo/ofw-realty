export class ResolveDisputeDto {
  resolution_note!: string
  outcome!: 'completed' | 'cancelled'
}
