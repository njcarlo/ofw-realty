import { Controller, Get, Param } from '@nestjs/common'
import { GeohazardService } from './geohazard.service'

@Controller('listings/:id/geohazard')
export class GeohazardController {
  constructor(private readonly geohazardService: GeohazardService) {}

  @Get()
  getReport(@Param('id') id: string) {
    return this.geohazardService.getReport(id)
  }
}
