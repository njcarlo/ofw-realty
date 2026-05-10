import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { CommissionEngineModule } from '../commission-engine/commission-engine.module'
import { ReservationRequestsController } from './reservation-requests.controller'
import { ReservationRequestsService } from './reservation-requests.service'
import { ReservationExpiryCron } from './reservation-expiry.cron'

@Module({
  imports: [AuthModule, CommissionEngineModule],
  controllers: [ReservationRequestsController],
  providers: [ReservationRequestsService, ReservationExpiryCron],
  exports: [ReservationRequestsService],
})
export class ReservationRequestsModule {}
