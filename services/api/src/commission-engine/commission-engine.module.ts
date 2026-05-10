import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { CommissionEngineController } from './commission-engine.controller'
import { CommissionEngineService } from './commission-engine.service'

@Module({
  imports: [AuthModule],
  controllers: [CommissionEngineController],
  providers: [CommissionEngineService],
  exports: [CommissionEngineService],
})
export class CommissionEngineModule {}
