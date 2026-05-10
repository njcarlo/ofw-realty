import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common'
import { ServicesAdminService } from './services-admin.service'
import { RejectProviderDto } from './dto/reject-provider.dto'
import { ResolveDisputeDto } from './dto/resolve-dispute.dto'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

/**
 * ServicesAdminController
 *
 * Admin moderation endpoints for the Services Portal.
 * All endpoints are guarded by JwtGuard + RolesGuard (admin only).
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 11.1, 11.4
 */
@Controller('admin/services')
@UseGuards(JwtGuard, RolesGuard)
@Roles('admin')
export class ServicesAdminController {
  constructor(private readonly adminService: ServicesAdminService) {}

  // ─── Requirement 8.2 ────────────────────────────────────────────────────────

  /**
   * GET /admin/services/providers/pending
   * List provider profiles with status = 'pending_review'.
   */
  @Get('providers/pending')
  listPendingProfiles() {
    return this.adminService.listPendingProfiles()
  }

  // ─── Requirement 8.3 ────────────────────────────────────────────────────────

  /**
   * PATCH /admin/services/providers/:id/approve
   * Approve a provider profile.
   */
  @Patch('providers/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveProfile(@Param('id') id: string, @Request() req: any) {
    return this.adminService.approveProfile(id, req.user.id)
  }

  /**
   * PATCH /admin/services/providers/:id/reject
   * Reject a provider profile. Requires non-empty `reason` (422 if absent).
   */
  @Patch('providers/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectProfile(
    @Param('id') id: string,
    @Body() dto: RejectProviderDto,
    @Request() req: any,
  ) {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new UnprocessableEntityException('A rejection reason is required')
    }
    return this.adminService.rejectProfile(id, req.user.id, dto.reason)
  }

  // ─── Requirement 8.5 ────────────────────────────────────────────────────────

  /**
   * DELETE /admin/services/providers/:id
   * Delete a provider profile that violates platform policies.
   */
  @Delete('providers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProfile(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteProfile(id, req.user.id)
  }

  /**
   * DELETE /admin/services/requests/:id
   * Delete a service request that violates platform policies.
   */
  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRequest(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteRequest(id, req.user.id)
  }

  // ─── Requirement 8.6 ────────────────────────────────────────────────────────

  /**
   * GET /admin/services/disputes
   * List engagements with status = 'disputed'.
   */
  @Get('disputes')
  listDisputedEngagements() {
    return this.adminService.listDisputedEngagements()
  }

  // ─── Requirement 8.7 ────────────────────────────────────────────────────────

  /**
   * PATCH /admin/services/engagements/:id/resolve
   * Resolve a disputed engagement. Requires non-empty `resolution_note` (422 if absent).
   */
  @Patch('engagements/:id/resolve')
  @HttpCode(HttpStatus.OK)
  resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @Request() req: any,
  ) {
    if (!dto.resolution_note || dto.resolution_note.trim().length === 0) {
      throw new UnprocessableEntityException('A resolution note is required')
    }
    if (!dto.outcome || !['completed', 'cancelled'].includes(dto.outcome)) {
      throw new UnprocessableEntityException(
        'outcome must be either "completed" or "cancelled"',
      )
    }
    return this.adminService.resolveDispute(
      id,
      req.user.id,
      dto.resolution_note,
      dto.outcome,
    )
  }

  // ─── Requirement 11.1, 11.4 ─────────────────────────────────────────────────

  /**
   * PATCH /admin/services/providers/:id/featured
   * Grant or revoke featured status.
   * Body: { grant: boolean, featured_until?: string }
   */
  @Patch('providers/:id/featured')
  @HttpCode(HttpStatus.OK)
  setFeaturedStatus(
    @Param('id') id: string,
    @Body() body: { grant: boolean; featured_until?: string },
    @Request() req: any,
  ) {
    if (typeof body.grant !== 'boolean') {
      throw new UnprocessableEntityException('grant must be a boolean')
    }
    return this.adminService.setFeaturedStatus(
      id,
      req.user.id,
      body.grant,
      body.featured_until,
    )
  }
}
