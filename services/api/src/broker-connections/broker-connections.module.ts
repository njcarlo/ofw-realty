import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { BrokerConnectionsController } from './broker-connections.controller'
import { BrokerConnectionsService } from './broker-connections.service'

@Module({
  imports: [AuthModule],
  controllers: [BrokerConnectionsController],
  providers: [BrokerConnectionsService],
  exports: [BrokerConnectionsService],
})
export class BrokerConnectionsModule {}
