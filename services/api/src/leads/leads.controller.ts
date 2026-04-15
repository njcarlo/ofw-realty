import { Controller, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { LeadsService } from './leads.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  findAll(
    @Request() req: any,
    @Query('listing_id') listingId?: string,
    @Query('status') status?: string,
  ) {
    return this.leadsService.findAll(req.user.id, listingId, status)
  }

  @Get('analytics/:listingId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  getAnalytics(@Param('listingId') listingId: string) {
    return this.leadsService.getAnalytics(listingId)
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'pending' | 'responded' | 'closed' },
  ) {
    return this.leadsService.updateStatus(id, body.status)
  }
}
