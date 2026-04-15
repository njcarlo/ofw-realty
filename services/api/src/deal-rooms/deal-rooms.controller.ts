import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { DealRoomsService } from './deal-rooms.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('deal-rooms')
export class DealRoomsController {
  constructor(private readonly dealRoomsService: DealRoomsService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(
    @Body() body: { transaction_id: string; buyer_id: string; co_borrower_id?: string },
    @Request() req: any,
  ) {
    return this.dealRoomsService.create(body, req.user.id)
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.dealRoomsService.findOne(id, req.user.id)
  }

  @Post(':id/documents')
  @UseGuards(JwtGuard)
  uploadDocument(
    @Param('id') id: string,
    @Body() body: { doc_type: string; file_url: string; party: 'buyer' | 'co_borrower' },
    @Request() req: any,
  ) {
    return this.dealRoomsService.uploadDocument(id, body, req.user.id)
  }
}
