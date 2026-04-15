import { Controller, Post, Body, Param } from '@nestjs/common'
import { ReportsService } from './reports.service'

@Controller('listings/:id/report')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  report(
    @Param('id') listingId: string,
    @Body() body: { reason: 'fraudulent' | 'misleading' | 'duplicate' | 'inappropriate'; description?: string },
  ) {
    return this.reportsService.report(listingId, body.reason, body.description)
  }
}
