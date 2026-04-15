import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findByTarget(@Query('target_id') targetId: string, @Query('target_type') targetType: string) {
    return this.reviewsService.findByTarget(targetId, targetType)
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('buyer')
  create(
    @Body() body: { transaction_id: string; target_id: string; target_type: string; rating: number; comment?: string },
    @Request() req: any,
  ) {
    return this.reviewsService.create(body, req.user.id)
  }

  @Post(':id/respond')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  respond(@Param('id') id: string, @Body() body: { response: string }) {
    return this.reviewsService.respond(id, body.response)
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.reviewsService.remove(id, req.user.id)
  }
}
