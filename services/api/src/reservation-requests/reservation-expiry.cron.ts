import { Injectable, Logger } from '@nestjs/common'
import { ReservationRequestsService } from './reservation-requests.service'

/**
 * Reservation expiry cron job.
 * Runs every 5 minutes to expire overdue pending reservations.
 *
 * NOTE: @nestjs/schedule is not yet installed. This class is structured
 * to be wired up once `@nestjs/schedule` is added as a dependency.
 * To activate: install @nestjs/schedule, import ScheduleModule.forRoot()
 * in AppModule, and uncomment the @Cron decorator below.
 */

// import { Cron } from '@nestjs/schedule'

@Injectable()
export class ReservationExpiryCron {
  private readonly logger = new Logger(ReservationExpiryCron.name)

  constructor(private readonly reservationService: ReservationRequestsService) {}

  // @Cron('*/5 * * * *')
  async handleExpiry() {
    this.logger.log('Running reservation expiry job...')
    try {
      const result = await this.reservationService.expireOverdueReservations()
      this.logger.log(`Expired ${result.expired} reservation(s)`)
    } catch (err) {
      this.logger.error('Reservation expiry job failed', err)
    }
  }
}
