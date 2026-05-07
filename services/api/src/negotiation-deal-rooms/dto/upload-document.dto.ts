export class UploadDocumentDto {
  file_name!: string
  file_type!: 'pdf' | 'jpeg' | 'png' | 'docx'
  file_size_bytes!: number
  category!:
    | 'proof_of_funds'
    | 'government_id'
    | 'spa'
    | 'reservation_agreement'
    | 'contract_to_sell'
    | 'title_copy'
    | 'other'
}
