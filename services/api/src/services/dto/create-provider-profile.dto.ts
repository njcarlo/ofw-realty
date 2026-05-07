export class CreateProviderProfileDto {
  full_name!: string
  license_number?: string
  license_type?: 'prc' | 'dti'
  service_types!: string[]
  coverage_areas!: string[]
  bio?: string
  contact_phone?: string
  contact_email?: string
  photo_url?: string
}
