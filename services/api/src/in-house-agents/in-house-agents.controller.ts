import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common'
import { InHouseAgentsService } from './in-house-agents.service'
import { JwtGuard } from '../auth/jwt.guard'
import { InviteAgentDto } from './dto/invite-agent.dto'

@Controller('in-house-agents')
@UseGuards(JwtGuard)
export class InHouseAgentsController {
  constructor(private readonly service: InHouseAgentsService) {}

  @Post('invite')
  invite(@Request() req: any, @Body() dto: InviteAgentDto) {
    return this.service.invite(req.user.id, dto)
  }

  @Patch(':id/accept')
  accept(@Request() req: any, @Param('id') id: string) {
    return this.service.accept(req.user.id, id)
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, id)
  }

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.id)
  }
}
