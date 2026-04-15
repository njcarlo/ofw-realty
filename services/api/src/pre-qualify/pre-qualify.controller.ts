import { Controller, Post, Body } from '@nestjs/common'
import { PreQualifyService } from './pre-qualify.service'

@Controller('pre-qualify')
export class PreQualifyController {
  constructor(private readonly preQualifyService: PreQualifyService) {}

  @Post()
  compute(@Body() body: {
    monthly_gross_income: number
    existing_monthly_debts: number
    age: number
    employment_type: 'ofw' | 'local_employed' | 'self_employed'
  }) {
    return this.preQualifyService.compute(body)
  }
}
