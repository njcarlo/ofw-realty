import { Module } from '@nestjs/common'
import { SpaController } from './spa.controller'
import { SpaService } from './spa.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [SpaController],
  providers: [SpaService],
})
export class SpaModule {}
