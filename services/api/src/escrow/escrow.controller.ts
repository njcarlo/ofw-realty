import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common'
import { EscrowService } from './escrow.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin', 'admin')
  create(@Body() body: any, @Request() req: any) {
    return this.escrowService.createEscrow(body)
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  getEscrow(@Param('id') id: string) {
    return this.escrowService.getEscrow(id)
  }

  @Patch(':id/milestones/:order/release')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin')
  releaseMilestone(
    @Param('id') id: string,
    @Param('order') order: string,
    @Request() req: any,
  ) {
    return this.escrowService.releaseMilestone(id, parseInt(order), req.user.id)
  }
}
