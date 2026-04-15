import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SavedAreasController } from './saved-areas.controller'
import { SavedAreasService } from './saved-areas.service'

@Module({
  imports: [AuthModule],
  controllers: [SavedAreasController],
  providers: [SavedAreasService],
})
export class SavedAreasModule {}


