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
import { ProvidersService } from './providers.service'
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto'
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto'
import { UpdateAvailabilityDto } from './dto/update-availability.dto'
import { JwtGuard } from '../auth/jwt.guard'
import { OwnerGuard, OwnerResource } from './guards/owner.guard'

@Controller('service-providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  /**
   * POST /service-providers
   * Register as a service provider (auth required).
   * Always sets status = 'pending_review'.
   */
  @Post()
  @UseGuards(JwtGuard)
  create(@Body() dto: CreateProviderProfileDto, @Request() req: any) {
    // Basic validation
    if (!dto.full_name || !dto.service_types || !dto.coverage_areas) {
      throw new BadRequestException(
        'full_name, service_types, and coverage_areas are required',
      )
    }

    if (dto.service_types.length === 0) {
      throw new BadRequestException('At least one service type is required')
    }

    if (dto.coverage_areas.length === 0) {
      throw new BadRequestException('At least one coverage area is required')
    }

    return this.providersService.create(dto, req.user.id)
  }

  /**
   * GET /service-providers
   * List approved providers (public, filterable by service_type, coverage_area, availability).
   * Sorted by: is_featured DESC, avg_rating DESC NULLS LAST, completed_engagements DESC.
   */
  @Get()
  findAll(@Query() query: Record<string, string>, @Request() req: any) {
    const isAuthenticated = !!req.user

    return this.providersService.findAll(
      {
        service_type: query.service_type,
        coverage_area: query.coverage_area,
        availability: query.availability,
      },
      isAuthenticated,
    )
  }

  /**
   * GET /service-providers/:id
   * Get provider profile (public, contact masked for unauthenticated callers).
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const isAuthenticated = !!req.user
    return this.providersService.findOne(id, isAuthenticated)
  }

  /**
   * PATCH /service-providers/:id
   * Update own profile (auth, owner only).
   * Resets status = 'pending_review' if license_number or license_type changes.
   * Preserves status for non-credential updates.
   */
  @Patch(':id')
  @UseGuards(JwtGuard, OwnerGuard)
  @OwnerResource('provider_profiles', 'user_id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProviderProfileDto,
    @Request() req: any,
  ) {
    return this.providersService.update(id, dto, req.user.id)
  }

  /**
   * PATCH /service-providers/:id/availability
   * Set availability status (auth, owner only).
   */
  @Patch(':id/availability')
  @UseGuards(JwtGuard, OwnerGuard)
  @OwnerResource('provider_profiles', 'user_id')
  updateAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
    @Request() req: any,
  ) {
    if (!dto.availability || !['available', 'busy'].includes(dto.availability)) {
      throw new BadRequestException(
        'availability must be either "available" or "busy"',
      )
    }

    return this.providersService.updateAvailability(id, dto, req.user.id)
  }
}
