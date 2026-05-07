export class UpdateDeveloperDto {
  company_name?: string
  primary_contact?: string
  logo_url?: string
  cover_url?: string
  description?: string
  office_address?: string
  website_url?: string
  social_links?: Record<string, string>
  years_in_operation?: number
}
