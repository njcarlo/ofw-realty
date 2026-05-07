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
import { DevelopersService } from './developers.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RegisterDeveloperDto } from './dto/register-developer.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { UpdateDeveloperDto } from './dto/update-developer.dto'

@Controller('developers')
export class DevelopersController {
  constructor(private readonly service: DevelopersService) {}

  @Post('register')
  register(@Body() dto: RegisterDeveloperDto) {
    return this.service.register(dto)
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.service.verifyEmail(dto.token)
  }

  @Get('me')
  @UseGuards(JwtGuard)
  getMe(@Request() req: any) {
    return this.service.getMe(req.user.id)
  }

  @Patch('me')
  @UseGuards(JwtGuard)
  updateMe(@Request() req: any, @Body() dto: UpdateDeveloperDto) {
    return this.service.updateMe(req.user.id, dto)
  }

  @Get('me/dashboard')
  @UseGuards(JwtGuard)
  getDashboard(@Request() req: any) {
    return this.service.getDashboard(req.user.id)
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  getPublicProfile(@Param('id') id: string) {
    return this.service.getPublicProfile(id)
  }
}
