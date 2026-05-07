import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { EngagementsService } from './engagements.service'
import { CreateEngagementMessageDto } from './dto/create-engagement-message.dto'
import { JwtGuard } from '../auth/jwt.guard'
import { ParticipantGuard } from './guards/participant.guard'

@Controller('engagements')
export class EngagementsController {
  constructor(private readonly engagementsService: EngagementsService) {}

  /**
   * GET /engagements
   * List all engagements where the authenticated user is a participant.
   * Returns engagements where user is requester OR provider.
   */
  @Get()
  @UseGuards(JwtGuard)
  findAll(@Request() req: any) {
    return this.engagementsService.findAll(req.user.id)
  }

  /**
   * GET /engagements/:id
   * Get a single engagement by ID.
   * Requires authentication and participant access (ParticipantGuard).
   */
  @Get(':id')
  @UseGuards(JwtGuard, ParticipantGuard)
  findOne(@Param('id') id: string) {
    return this.engagementsService.findOne(id)
  }

  /**
   * PATCH /engagements/:id/complete
   * Mark the engagement as completed by the current user.
   *
   * - If user is requester: sets requester_completed_at
   * - If user is provider: sets provider_completed_at
   * - When both are set: transitions status to 'completed' and sets rating_window_closes_at
   */
  @Patch(':id/complete')
  @UseGuards(JwtGuard, ParticipantGuard)
  complete(@Param('id') id: string, @Request() req: any) {
    const participantRole = req.participantRole
    return this.engagementsService.complete(id, req.user.id, participantRole)
  }

  /**
   * PATCH /engagements/:id/dispute
   * Raise a dispute on an active engagement.
   *
   * - Only allowed if status = 'active'
   * - Sets status = 'disputed', dispute_raised_by, dispute_raised_at
   */
  @Patch(':id/dispute')
  @UseGuards(JwtGuard, ParticipantGuard)
  dispute(@Param('id') id: string, @Request() req: any) {
    return this.engagementsService.dispute(id, req.user.id)
  }

  /**
   * POST /engagements/:id/messages
   * Send a message in the engagement thread.
   *
   * - Blocked if engagement status is not 'active' or 'disputed'
   */
  @Post(':id/messages')
  @UseGuards(JwtGuard, ParticipantGuard)
  @HttpCode(HttpStatus.CREATED)
  createMessage(
    @Param('id') id: string,
    @Body() dto: CreateEngagementMessageDto,
    @Request() req: any,
  ) {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('content is required')
    }
    return this.engagementsService.createMessage(id, dto, req.user.id)
  }

  /**
   * GET /engagements/:id/messages
   * Get all messages in the engagement thread, ordered by created_at ASC.
   * Requires authentication and participant access (ParticipantGuard).
   */
  @Get(':id/messages')
  @UseGuards(JwtGuard, ParticipantGuard)
  getMessages(@Param('id') id: string) {
    return this.engagementsService.getMessages(id)
  }
}
