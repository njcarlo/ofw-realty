import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common'
import { InquiriesService } from './inquiries.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  @UseGuards(JwtGuard)
  findAll(@Request() req: any) {
    return this.inquiriesService.findAll(req.user.id, req.user.user_metadata?.role)
  }

  @Post()
  @UseGuards(JwtGuard)
  create(
    @Body() body: { listing_id: string; message: string; offer_price_php?: number },
    @Request() req: any,
  ) {
    return this.inquiriesService.create(body, req.user.id)
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'pending' | 'responded' | 'closed' },
    @Request() req: any,
  ) {
    return this.inquiriesService.updateStatus(id, body.status, req.user.id)
  }
}
