import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { DeveloperAdminController } from './developer-admin.controller'
import { DeveloperAdminService } from './developer-admin.service'

@Module({
  imports: [AuthModule],
  controllers: [DeveloperAdminController],
  providers: [DeveloperAdminService],
  exports: [DeveloperAdminService],
})
export class DeveloperAdminModule {}
