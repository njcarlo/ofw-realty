import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common'
import { CommissionEngineService } from './commission-engine.service'
import { JwtGuard } from '../auth/jwt.guard'
import { SetCommissionRateDto } from './dto/set-commission-rate.dto'
import { SetDefaultRateDto } from './dto/set-default-rate.dto'
import { UpdateRateDto } from './dto/update-rate.dto'
import { AddPromoRateDto } from './dto/add-promo-rate.dto'

@Controller('commission-rates')
@UseGuards(JwtGuard)
export class CommissionEngineController {
  constructor(private readonly service: CommissionEngineService) {}

  @Post()
  setRate(@Request() req: any, @Body() dto: SetCommissionRateDto) {
    return this.service.setRate(req.user.id, dto)
  }

  @Post('default')
  setDefaultRate(@Request() req: any, @Body() dto: SetDefaultRateDto) {
    return this.service.setDefaultRate(req.user.id, dto)
  }

  @Get(':connectionId')
  getApplicableRate(@Param('connectionId') connectionId: string) {
    return this.service.getApplicableRate(connectionId)
  }

  @Patch(':id')
  updateRate(@Param('id') id: string, @Body() dto: UpdateRateDto) {
    return this.service.updateRate(id, dto)
  }

  @Post(':id/promo')
  addPromoRate(@Param('id') id: string, @Body() dto: AddPromoRateDto) {
    return this.service.addPromoRate(id, dto)
  }
}
