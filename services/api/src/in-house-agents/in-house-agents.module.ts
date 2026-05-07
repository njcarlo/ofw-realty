import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { InHouseAgentsController } from './in-house-agents.controller'
import { InHouseAgentsService } from './in-house-agents.service'

@Module({
  imports: [AuthModule],
  controllers: [InHouseAgentsController],
  providers: [InHouseAgentsService],
  exports: [InHouseAgentsService],
})
export class InHouseAgentsModule {}
