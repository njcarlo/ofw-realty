export class UpdateChecklistDto {
  status!: 'pending' | 'in_progress' | 'completed'
}

export class AddChecklistItemDto {
  label!: string
}
