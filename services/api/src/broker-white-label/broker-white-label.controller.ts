import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common'
import { BrokerWhiteLabelService } from './broker-white-label.service'
import { JwtGuard } from '../auth/jwt.guard'
import { SetVanitySlugDto } from './dto/set-vanity-slug.dto'
import { UploadCoverDto } from './dto/upload-cover.dto'

@Controller('broker-companies')
@UseGuards(JwtGuard)
export class BrokerWhiteLabelController {
  constructor(private readonly service: BrokerWhiteLabelService) {}

  @Patch('me/vanity-slug')
  setVanitySlug(@Request() req: any, @Body() dto: SetVanitySlugDto) {
    return this.service.setVanitySlug(req.user.id, dto)
  }

  @Get('slug/:slug')
  resolveSlug(@Param('slug') slug: string) {
    return this.service.resolveSlug(slug)
  }

  @Post('me/cover')
  uploadCover(@Request() req: any, @Body() dto: UploadCoverDto) {
    return this.service.getSignedCoverUploadUrl(req.user.id, dto)
  }
}
