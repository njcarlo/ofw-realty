import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ReservationRequestsService } from './reservation-requests.service'
import { JwtGuard } from '../auth/jwt.guard'
import { SubmitReservationDto } from './dto/submit-reservation.dto'
import { RejectReservationDto } from './dto/reject-reservation.dto'

@Controller('reservations')
@UseGuards(JwtGuard)
export class ReservationRequestsController {
  constructor(private readonly service: ReservationRequestsService) {}

  @Post()
  submit(@Request() req: any, @Body() dto: SubmitReservationDto) {
    return this.service.submit(req.user.id, dto)
  }

  @Patch(':id/confirm')
  confirm(@Request() req: any, @Param('id') id: string) {
    return this.service.confirm(req.user.id, id)
  }

  @Patch(':id/reject')
  reject(@Request() req: any, @Param('id') id: string, @Body() dto: RejectReservationDto) {
    return this.service.reject(req.user.id, id, dto)
  }

  @Get()
  list(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('unit_id') unit_id?: string,
  ) {
    return this.service.list(req.user.id, { status, unit_id })
  }
}
