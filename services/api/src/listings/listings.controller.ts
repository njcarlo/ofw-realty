import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
  BadRequestException
} from '@nestjs/common'
import { ListingsService } from './listings.service'
import { CreateListingSchema, UpdateListingSchema } from './listings.dto'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'
import { z } from 'zod'

const StatusTransitionSchema = z.object({
  status: z.enum(['active', 'reserved', 'sold', 'deactivated']),
  reason: z.string().optional(),
})

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // Public: browse listings
  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.listingsService.findAll(query)
  }

  // Public: listing detail
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id)
  }

  // Protected: create listing (realtor/seller)
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'seller', 'broker_admin')
  create(@Body() body: unknown, @Request() req: any) {
    const result = CreateListingSchema.safeParse(body)
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      })
    }
    return this.listingsService.create(result.data, req.user.id)
  }

  // Protected: update listing fields
  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'seller', 'broker_admin')
  update(@Param('id') id: string, @Body() body: unknown, @Request() req: any) {
    const result = UpdateListingSchema.safeParse(body)
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      })
    }
    return this.listingsService.update(id, result.data, req.user.id)
  }

  // Protected: explicit status transition endpoint
  // Enforces: active → reserved → sold (terminal), active ↔ deactivated
  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'seller', 'broker_admin', 'admin')
  updateStatus(@Param('id') id: string, @Body() body: unknown, @Request() req: any) {
    const result = StatusTransitionSchema.safeParse(body)
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      })
    }
    return this.listingsService.update(id, { status: result.data.status } as any, req.user.id)
  }

  // Protected: deactivate listing
  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'seller', 'broker_admin', 'admin')
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.listingsService.deactivate(id, req.user.id)
  }

  // Public: closing costs
  @Get(':id/closing-costs')
  getClosingCosts(
    @Param('id') id: string,
    @Query('selling_price') sellingPrice?: string,
  ) {
    return this.listingsService.getClosingCosts(id, sellingPrice ? parseFloat(sellingPrice) : undefined)
  }
}
