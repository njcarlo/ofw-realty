import { Controller, Get, Post, Query, Body, UseGuards, Request } from '@nestjs/common'
import { SpaService } from './spa.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('spa')
export class SpaController {
  constructor(private readonly spaService: SpaService) {}

  @Get('embassies')
  searchEmbassies(@Query('q') query: string) {
    return this.spaService.searchEmbassies(query)
  }

  @Get('template')
  @UseGuards(JwtGuard)
  generateTemplate(@Query('listing_id') listingId: string, @Request() req: any) {
    return this.spaService.generateSpaTemplate(req.user.id, listingId)
  }

  @Post('upload')
  @UseGuards(JwtGuard)
  uploadSpa(
    @Body() body: { listing_id: string; file_url: string; realtor_id: string },
    @Request() req: any,
  ) {
    return this.spaService.uploadSpa(body, req.user.id)
  }
}
