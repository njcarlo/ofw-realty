import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { InfrastructureController } from './infrastructure.controller'
import { InfrastructureService } from './infrastructure.service'

@Module({
  imports: [AuthModule],
  controllers: [InfrastructureController],
  providers: [InfrastructureService],
})
export class InfrastructureModule {}


