import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { GeohazardController } from './geohazard.controller'
import { GeohazardService } from './geohazard.service'

@Module({
  imports: [AuthModule],
  controllers: [GeohazardController],
  providers: [GeohazardService],
})
export class GeohazardModule {}


