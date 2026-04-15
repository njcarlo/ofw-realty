import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { PreQualifyController } from './pre-qualify.controller'
import { PreQualifyService } from './pre-qualify.service'

@Module({
  imports: [AuthModule],
  controllers: [PreQualifyController],
  providers: [PreQualifyService],
})
export class PreQualifyModule {}


