import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { CoBrokingController } from './co-broking.controller'
import { CoBrokingService } from './co-broking.service'

@Module({
  imports: [AuthModule],
  controllers: [CoBrokingController],
  providers: [CoBrokingService],
})
export class CoBrokingModule {}


