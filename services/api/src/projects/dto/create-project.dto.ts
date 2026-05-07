export class CreateProjectDto {
  name!: string
  project_type!: 'subdivision' | 'condominium' | 'townhouse' | 'mixed_use'
  province!: string
  city!: string
  barangay?: string
  lat!: number
  lng!: number
  total_units!: number
  site_map_url?: string
  video_url?: string
  virtual_tour_url?: string
}
