import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { BrokerConnectionsService } from './broker-connections.service'
import { JwtGuard } from '../auth/jwt.guard'
import { ConnectionRequestDto } from './dto/connection-request.dto'

@Controller()
@UseGuards(JwtGuard)
export class BrokerConnectionsController {
  constructor(private readonly service: BrokerConnectionsService) {}

  @Post('broker-connections/request')
  sendRequest(@Request() req: any, @Body() dto: ConnectionRequestDto) {
    return this.service.sendRequest(req.user.id, dto)
  }

  @Patch('broker-connections/:id/accept')
  accept(@Request() req: any, @Param('id') id: string) {
    return this.service.accept(req.user.id, id)
  }

  @Patch('broker-connections/:id/decline')
  decline(@Request() req: any, @Param('id') id: string) {
    return this.service.decline(req.user.id, id)
  }

  @Delete('broker-connections/:id')
  terminate(@Request() req: any, @Param('id') id: string) {
    return this.service.terminate(req.user.id, id)
  }

  @Get('broker-connections')
  listConnections(@Request() req: any) {
    return this.service.listConnections(req.user.id)
  }

  // Broker discovery directory (for developers)
  @Get('brokers')
  listBrokers(
    @Query('province') province?: string,
    @Query('city') city?: string,
    @Query('verified') verified?: string,
  ) {
    return this.service.listBrokers({ province, city, verified })
  }

  // Developer discovery directory (for brokers)
  @Get('developers')
  listDevelopers(
    @Query('project_type') project_type?: string,
    @Query('province') province?: string,
    @Query('city') city?: string,
  ) {
    return this.service.listDevelopers({ project_type, province, city })
  }
}
