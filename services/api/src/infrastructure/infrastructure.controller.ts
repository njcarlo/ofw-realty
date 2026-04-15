import { Controller, Get } from '@nestjs/common'
import { InfrastructureService } from './infrastructure.service'

@Controller('map/infrastructure')
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @Get()
  getOverlay() {
    return this.infrastructureService.getOverlay()
  }
}
