import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { JwtGuard } from '../auth/jwt.guard'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { UpdateProjectStatusDto } from './dto/update-project-status.dto'
import { UploadPhotoDto } from './dto/upload-photo.dto'

@Controller('projects')
@UseGuards(JwtGuard)
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateProjectDto) {
    return this.service.create(req.user.id, dto)
  }

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.id)
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id)
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(req.user.id, id, dto)
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.service.updateStatus(req.user.id, id, dto)
  }

  @Post(':id/photos')
  uploadPhoto(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UploadPhotoDto,
  ) {
    return this.service.getSignedPhotoUploadUrl(req.user.id, id, dto)
  }
}
