import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthModule } from './auth/auth.module'
import { ListingsModule } from './listings/listings.module'
import { MapModule } from './map/map.module'
import { DocumentsModule } from './documents/documents.module'
import { SpaModule } from './spa/spa.module'
import { InquiriesModule } from './inquiries/inquiries.module'
import { PreQualifyModule } from './pre-qualify/pre-qualify.module'
import { GeohazardModule } from './geohazard/geohazard.module'
import { ProfilesModule } from './profiles/profiles.module'
// Phase 2 modules
import { SavedAreasModule } from './saved-areas/saved-areas.module'
import { ReviewsModule } from './reviews/reviews.module'
import { ReportsModule } from './reports/reports.module'
import { LeadsModule } from './leads/leads.module'
import { CoBrokingModule } from './co-broking/co-broking.module'
import { DealRoomsModule } from './deal-rooms/deal-rooms.module'
import { InfrastructureModule } from './infrastructure/infrastructure.module'
import { NegotiationDealRoomsModule } from './negotiation-deal-rooms/negotiation-deal-rooms.module'
// Phase 3 modules
import { EscrowModule } from './escrow/escrow.module'
import { TokensModule } from './tokens/tokens.module'
import { PropertyManagementModule } from './property-management/property-management.module'
import { AdsModule } from './ads/ads.module'
// Developer Portal modules
import { DevelopersModule } from './developers/developers.module'
import { ProjectsModule } from './projects/projects.module'
import { UnitsModule } from './units/units.module'
import { BrokerConnectionsModule } from './broker-connections/broker-connections.module'
import { CommissionEngineModule } from './commission-engine/commission-engine.module'
import { ReservationRequestsModule } from './reservation-requests/reservation-requests.module'
import { InHouseAgentsModule } from './in-house-agents/in-house-agents.module'
import { BrokerWhiteLabelModule } from './broker-white-label/broker-white-label.module'
import { DeveloperAdminModule } from './developer-admin/developer-admin.module'
// Services Portal module
import { ServicesModule } from './services/services.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    ListingsModule,
    MapModule,
    DocumentsModule,
    SpaModule,
    InquiriesModule,
    PreQualifyModule,
    GeohazardModule,
    ProfilesModule,
    // Phase 2
    SavedAreasModule,
    ReviewsModule,
    ReportsModule,
    LeadsModule,
    CoBrokingModule,
    DealRoomsModule,
    NegotiationDealRoomsModule,
    InfrastructureModule,
    // Phase 3
    EscrowModule,
    TokensModule,
    PropertyManagementModule,
    AdsModule,
    // Developer Portal
    DevelopersModule,
    ProjectsModule,
    UnitsModule,
    BrokerConnectionsModule,
    CommissionEngineModule,
    ReservationRequestsModule,
    InHouseAgentsModule,
    BrokerWhiteLabelModule,
    DeveloperAdminModule,
    // Services Portal
    ServicesModule,
  ],
})
export class AppModule {}
