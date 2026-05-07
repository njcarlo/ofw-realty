import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ProposalsService } from './proposals.service'
import { CreateProposalDto } from './dto/create-proposal.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('service-requests/:requestId/proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  /**
   * POST /service-requests/:requestId/proposals
   * Submit a proposal (auth required, provider only).
   *
   * - Provider must have an approved provider_profile
   * - Rejects with 422 if proposal_count >= 10
   * - Rejects with 409 if duplicate (request_id, provider_id)
   */
  @Post()
  @UseGuards(JwtGuard)
  create(
    @Param('requestId') requestId: string,
    @Body() dto: CreateProposalDto,
    @Request() req: any,
  ) {
    if (!dto.message || dto.message.trim().length === 0) {
      throw new BadRequestException('message is required')
    }
    if (!dto.estimated_timeline || dto.estimated_timeline.trim().length === 0) {
      throw new BadRequestException('estimated_timeline is required')
    }

    return this.proposalsService.create(requestId, dto, req.user.id)
  }

  /**
   * GET /service-requests/:requestId/proposals
   * List all proposals for a service request (auth, requester owner only).
   */
  @Get()
  @UseGuards(JwtGuard)
  findAll(@Param('requestId') requestId: string, @Request() req: any) {
    return this.proposalsService.findAll(requestId, req.user.id)
  }

  /**
   * DELETE /service-requests/:requestId/proposals/:id
   * Withdraw a proposal (auth, provider owner, pre-selection only).
   *
   * - Only the provider who submitted can withdraw
   * - Blocked if proposal status = 'accepted'
   */
  @Delete(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  withdraw(
    @Param('requestId') requestId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.proposalsService.withdraw(requestId, id, req.user.id)
  }

  /**
   * PATCH /service-requests/:requestId/proposals/:id/accept
   * Accept a proposal (auth, requester owner only).
   *
   * - Creates an engagement row (status = 'active')
   * - Sets service_requests.status = 'in_progress'
   * - Rejects all other pending proposals for this request
   */
  @Patch(':id/accept')
  @UseGuards(JwtGuard)
  accept(
    @Param('requestId') requestId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.proposalsService.accept(requestId, id, req.user.id)
  }
}
