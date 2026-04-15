import { Controller, Get, Param, Query } from '@nestjs/common'
import { ProfilesService } from './profiles.service'

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('agents')
  getAgents(@Query('q') q?: string) {
    return this.profilesService.getAgents(q)
  }

  @Get('agents/:slug')
  getAgent(@Param('slug') slug: string) {
    return this.profilesService.getAgent(slug)
  }

  @Get('brokers')
  getBrokers(@Query('q') q?: string) {
    return this.profilesService.getBrokers(q)
  }

  @Get('brokers/:slug')
  getBroker(@Param('slug') slug: string) {
    return this.profilesService.getBroker(slug)
  }
}
