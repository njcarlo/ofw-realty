import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common'
import { DocumentsService } from './documents.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Get document checklist for a realtor or brokerage
  @Get(':ownerId')
  @UseGuards(JwtGuard)
  getChecklist(@Param('ownerId') ownerId: string) {
    return this.documentsService.getChecklist(ownerId)
  }

  // Upload a document
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  upload(@Body() body: { owner_id: string; owner_type: string; doc_type: string; doc_number: number; file_url: string; expiry_date?: string }, @Request() req: any) {
    return this.documentsService.upload(body, req.user.id)
  }

  // Admin: approve or reject a document
  @Patch(':id/review')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin')
  review(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; rejection_reason?: string },
    @Request() req: any,
  ) {
    return this.documentsService.review(id, body.action, req.user.id, body.rejection_reason)
  }

  // Blockchain verification lookup
  @Get(':id/verify')
  verify(@Param('id') id: string) {
    return this.documentsService.verifyOnBlockchain(id)
  }
}
