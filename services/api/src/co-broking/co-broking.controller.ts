import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common'
import { CoBrokingService } from './co-broking.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

@Controller('co-broking')
export class CoBrokingController {
  constructor(private readonly coBrokingService: CoBrokingService) {}

  // Get shared inventory for co-broking network members
  @Get('inventory')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  getInventory(@Request() req: any) {
    return this.coBrokingService.getInventory(req.user.id)
  }

  // Request to co-list a property
  @Post('request')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  requestCoListing(
    @Body() body: { listing_id: string; commission_split: number },
    @Request() req: any,
  ) {
    return this.coBrokingService.requestCoListing(body, req.user.id)
  }

  // Primary broker approves/rejects co-listing request
  @Patch(':id/approve')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('broker_admin')
  approve(@Param('id') id: string) {
    return this.coBrokingService.updateStatus(id, 'approved')
  }

  @Patch(':id/remove')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('broker_admin')
  remove(@Param('id') id: string) {
    return this.coBrokingService.updateStatus(id, 'removed')
  }
}
