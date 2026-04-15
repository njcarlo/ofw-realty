import { Module } from '@nestjs/common'
import { AdsController } from './ads.controller'
import { AdsService } from './ads.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
