import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common'
import { PropertyManagementService } from './property-management.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('property-management')
@UseGuards(JwtGuard)
export class PropertyManagementController {
  constructor(private readonly service: PropertyManagementService) {}

  @Get('units')
  getUnits(@Request() req: any) {
    return this.service.getUnits(req.user.id)
  }

  @Post('tickets')
  submitTicket(@Body() body: any, @Request() req: any) {
    return this.service.submitMaintenanceTicket({ ...body, tenant_id: req.user.id })
  }

  @Get('income-statement')
  getIncomeStatement(@Request() req: any, @Query('month') month: string) {
    return this.service.generateIncomeStatement(req.user.id, month ?? new Date().toISOString().slice(0, 7))
  }
}
