export class ConnectionRequestDto {
  // Either developer_id or broker_id depending on who initiates
  target_id!: string
  initiated_by!: 'developer' | 'broker'
}
