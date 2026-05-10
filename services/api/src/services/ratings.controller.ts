import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { RatingsService } from './ratings.service'
import { CreateRatingDto } from './dto/create-rating.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('engagements')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  /**
   * POST /engagements/:engagementId/rating
   *
   * Submit a rating for a completed engagement.
   * Auth required; only the requester of the engagement may submit.
   *
   * Validation:
   * - score must be an integer in [1, 5] (422 otherwise)
   * - Duplicate rating for same engagement → 409
   * - rating_window_closes_at < now() → 422
   *
   * Side effects:
   * - Recomputes provider_profiles.avg_rating
   * - Increments provider_profiles.completed_engagements
   */
  @Post(':engagementId/rating')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('engagementId') engagementId: string,
    @Body() dto: CreateRatingDto,
    @Request() req: any,
  ) {
    return this.ratingsService.create(engagementId, dto, req.user.id)
  }
}
