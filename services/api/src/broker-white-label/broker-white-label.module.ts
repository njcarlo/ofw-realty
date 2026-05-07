import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { BrokerWhiteLabelController } from './broker-white-label.controller'
import { BrokerWhiteLabelService } from './broker-white-label.service'

@Module({
  imports: [AuthModule],
  controllers: [BrokerWhiteLabelController],
  providers: [BrokerWhiteLabelService],
  exports: [BrokerWhiteLabelService],
})
export class BrokerWhiteLabelModule {}
