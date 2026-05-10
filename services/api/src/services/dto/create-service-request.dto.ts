export type ServiceType =
  | 'property_appraisal'
  | 'geodetic_survey'
  | 'title_transfer'
  | 'notarization'
  | 'legal_consultation'
  | 'property_tax_assistance'
  | 'building_permit_processing'
  | 'other'

export class CreateServiceRequestDto {
  service_type!: ServiceType
  /** Required when service_type === 'other' */
  other_description?: string
  description!: string
  province!: string
  city!: string
  barangay?: string
  preferred_timeline?: string
  budget_min_php?: number
  budget_max_php?: number
}
