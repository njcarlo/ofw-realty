export class RegisterDeveloperDto {
  company_name!: string
  company_type!: 'corporation' | 'sole_proprietorship' | 'partnership'
  primary_contact!: string
  email!: string
  phone!: string
}
