import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { UnitsService } from './units.service'
import { JwtGuard } from '../auth/jwt.guard'
import { CreateUnitDto } from './dto/create-unit.dto'
import { UpdateUnitDto } from './dto/update-unit.dto'
import { BulkImportDto } from './dto/bulk-import.dto'

@Controller()
@UseGuards(JwtGuard)
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  // Routes nested under /projects/:id/units
  @Post('projects/:id/units')
  createUnit(@Param('id') projectId: string, @Body() dto: CreateUnitDto) {
    return this.service.createUnit(projectId, dto)
  }

  @Post('projects/:id/units/bulk')
  bulkImport(@Param('id') projectId: string, @Body() dto: BulkImportDto) {
    return this.service.bulkImport(projectId, dto)
  }

  @Get('projects/:id/units')
  listUnits(@Param('id') projectId: string, @Query('status') status?: string) {
    return this.service.listUnits(projectId, status)
  }

  @Get('projects/:id/inventory-sheet')
  exportCsv(@Param('id') projectId: string) {
    return this.service.exportInventoryCsv(projectId)
  }

  @Get('projects/:id/inventory-sheet/pdf')
  exportPdf(@Param('id') projectId: string) {
    return this.service.exportInventoryPdf(projectId)
  }

  // Standalone unit update
  @Patch('units/:id')
  updateUnit(@Param('id') unitId: string, @Body() dto: UpdateUnitDto) {
    return this.service.updateUnit(unitId, dto)
  }
}
