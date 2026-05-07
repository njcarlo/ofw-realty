import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { DeveloperAdminService } from './developer-admin.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RejectDeveloperDto } from './dto/reject-developer.dto'

@Controller('admin/developers')
@UseGuards(JwtGuard)
export class DeveloperAdminController {
  constructor(private readonly service: DeveloperAdminService) {}

  @Get('pending')
  listPending() {
    return this.service.listPending()
  }

  @Get()
  listAll(
    @Query('verification_status') verification_status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listAll({ verification_status, search })
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id)
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDeveloperDto) {
    return this.service.reject(id, dto)
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.service.suspend(id)
  }
}
