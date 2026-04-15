import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { SavedAreasService } from './saved-areas.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('saved-areas')
export class SavedAreasController {
  constructor(private readonly savedAreasService: SavedAreasService) {}

  @Get()
  @UseGuards(JwtGuard)
  findAll(@Request() req: any) {
    return this.savedAreasService.findAll(req.user.id)
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: { name: string; boundary: object; level: string }, @Request() req: any) {
    return this.savedAreasService.create(body, req.user.id)
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.savedAreasService.remove(id, req.user.id)
  }
}
