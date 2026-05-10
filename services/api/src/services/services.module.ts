import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { OwnerGuard } from './guards/owner.guard'
import { ParticipantGuard } from './guards/participant.guard'
import { ProvidersController } from './providers.controller'
import { ProvidersService } from './providers.service'
import { PrcVerificationService } from './prc-verification.service'
import { RequestsController } from './requests.controller'
import { RequestsService } from './requests.service'
import { ProposalsController } from './proposals.controller'
import { ProposalsService } from './proposals.service'
import { EngagementsController } from './engagements.controller'
import { EngagementsService } from './engagements.service'
import { RatingsController } from './ratings.controller'
import { RatingsService } from './ratings.service'
import { NotificationsService } from './notifications.service'
import { ServicesAdminService } from './services-admin.service'
import { ServicesAdminController } from './services-admin.controller'
import { ServicesScheduler } from './services-scheduler.service'

@Module({
  imports: [AuthModule],
  controllers: [
    ProvidersController,
    RequestsController,
    ProposalsController,
    EngagementsController,
    RatingsController,
    ServicesAdminController,
  ],
  providers: [
    OwnerGuard,
    ParticipantGuard,
    NotificationsService,
    ProvidersService,
    PrcVerificationService,
    RequestsService,
    ProposalsService,
    EngagementsService,
    RatingsService,
    ServicesAdminService,
    ServicesScheduler,
  ],
  exports: [
    OwnerGuard,
    ParticipantGuard,
    NotificationsService,
    ProvidersService,
    PrcVerificationService,
    RequestsService,
    ProposalsService,
    EngagementsService,
    RatingsService,
    ServicesAdminService,
    ServicesScheduler,
  ],
})
export class ServicesModule {}
