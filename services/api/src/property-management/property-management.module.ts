import { Module } from '@nestjs/common'
import { PropertyManagementController } from './property-management.controller'
import { PropertyManagementService } from './property-management.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [PropertyManagementController],
  providers: [PropertyManagementService],
})
export class PropertyManagementModule {}
