export class SendMessageDto {
  content_enc!: string
  content_iv!: string
  message_type!: 'text' | 'image'
  attachment_url?: string
}
