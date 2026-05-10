import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common'
import { RequestsService } from './requests.service'
import { CreateServiceRequestDto } from './dto/create-service-request.dto'
import { JwtGuard } from '../auth/jwt.guard'
import { OwnerGuard, OwnerResource } from './guards/owner.guard'

@Controller('service-requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  /**
   * POST /service-requests
   * Create a new service request (auth required).
   * Always sets status = 'open', expires_at = now() + 30 days.
   * Enforces other_description required when service_type = 'other'.
   */
  @Post()
  @UseGuards(JwtGuard)
  create(@Body() dto: CreateServiceRequestDto, @Request() req: any) {
    if (!dto.service_type) {
      throw new BadRequestException('service_type is required')
    }
    if (!dto.description || dto.description.trim().length === 0) {
      throw new BadRequestException('description is required')
    }
    if (!dto.province || dto.province.trim().length === 0) {
      throw new BadRequestException('province is required')
    }
    if (!dto.city || dto.city.trim().length === 0) {
      throw new BadRequestException('city is required')
    }

    return this.requestsService.create(dto, req.user.id)
  }

  /**
   * GET /service-requests
   * List open/in_progress service requests (public, filterable).
   * Masks description and requester contact for unauthenticated callers.
   * Filters: service_type, province, city, date_from, date_to.
   */
  @Get()
  findAll(@Query() query: Record<string, string>, @Request() req: any) {
    const isAuthenticated = !!req.user

    return this.requestsService.findAll(
      {
        service_type: query.service_type,
        province: query.province,
        city: query.city,
        date_from: query.date_from,
        date_to: query.date_to,
      },
      isAuthenticated,
    )
  }

  /**
   * GET /service-requests/:id
   * Get a single service request (public, masked if unauthenticated).
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const isAuthenticated = !!req.user
    return this.requestsService.findOne(id, isAuthenticated)
  }

  /**
   * PATCH /service-requests/:id/cancel
   * Cancel own service request (auth, owner, pre-engagement only).
   */
  @Patch(':id/cancel')
  @UseGuards(JwtGuard, OwnerGuard)
  @OwnerResource('service_requests', 'requester_id')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.cancel(id, req.user.id)
  }

  /**
   * PATCH /service-requests/:id/extend
   * Extend expiring request by 15 days (auth, owner).
   * Sets expires_at = expires_at + 15 days, extension_granted = true.
   */
  @Patch(':id/extend')
  @UseGuards(JwtGuard, OwnerGuard)
  @OwnerResource('service_requests', 'requester_id')
  extend(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.extend(id, req.user.id)
  }
}
