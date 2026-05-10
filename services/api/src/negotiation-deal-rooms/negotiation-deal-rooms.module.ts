import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { NegotiationDealRoomsController } from './negotiation-deal-rooms.controller'
import { NegotiationDealRoomsService } from './negotiation-deal-rooms.service'
import { ParticipantGuard } from './guards/participant.guard'
import { RoleGuard } from './guards/role.guard'

@Module({
  imports: [AuthModule],
  controllers: [NegotiationDealRoomsController],
  providers: [NegotiationDealRoomsService, ParticipantGuard, RoleGuard],
  exports: [NegotiationDealRoomsService],
})
export class NegotiationDealRoomsModule {}
