import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { NegotiationDealRoomsService } from './negotiation-deal-rooms.service'
import { JwtGuard } from '../auth/jwt.guard'
import { ParticipantGuard } from './guards/participant.guard'
import { RoleGuard, RoomRoles } from './guards/role.guard'
import { CreateRoomDto } from './dto/create-room.dto'
import { SubmitOfferDto } from './dto/submit-offer.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { UploadDocumentDto } from './dto/upload-document.dto'
import { UpdateChecklistDto, AddChecklistItemDto } from './dto/update-checklist.dto'
import { UpdateStatusDto } from './dto/update-status.dto'

@Controller('negotiation-deal-rooms')
@UseGuards(JwtGuard)
export class NegotiationDealRoomsController {
  constructor(private readonly service: NegotiationDealRoomsService) {}

  // ─── Room ────────────────────────────────────────────────────────────────────

  @Post()
  createRoom(@Body() dto: CreateRoomDto, @Request() req: any) {
    return this.service.createRoom(dto, req.user.id)
  }

  @Get()
  listRooms(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('listing_id') listing_id?: string,
  ) {
    const userRole = req.user?.user_metadata?.role
    return this.service.listRooms(req.user.id, userRole, { status, listing_id })
  }

  @Get(':id')
  @UseGuards(ParticipantGuard)
  getRoom(@Param('id') id: string, @Request() req: any) {
    return this.service.getRoom(id, req.user.id, req.isAdminBypass)
  }

  @Post(':id/participants')
  @UseGuards(ParticipantGuard, RoleGuard)
  @RoomRoles('realtor')
  addParticipant(
    @Param('id') id: string,
    @Body() body: { seller_id: string },
    @Request() req: any,
  ) {
    return this.service.addParticipant(id, body.seller_id, req.user.id)
  }

  // ─── Offers ──────────────────────────────────────────────────────────────────

  @Post(':id/offers')
  @UseGuards(ParticipantGuard)
  submitOffer(@Param('id') id: string, @Body() dto: SubmitOfferDto, @Request() req: any) {
    return this.service.submitOffer(id, dto, req.user.id, req.participantRole)
  }

  @Get(':id/offers')
  @UseGuards(ParticipantGuard)
  getOffers(@Param('id') id: string) {
    return this.service.getOffers(id)
  }

  // ─── Messages ────────────────────────────────────────────────────────────────

  @Post(':id/messages')
  @UseGuards(ParticipantGuard)
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @Request() req: any) {
    return this.service.sendMessage(id, dto, req.user.id, req.participantRole)
  }

  @Get(':id/messages')
  @UseGuards(ParticipantGuard)
  getMessages(@Param('id') id: string) {
    return this.service.getMessages(id)
  }

  @Post(':id/messages/:msgId/read')
  @UseGuards(ParticipantGuard)
  @HttpCode(HttpStatus.OK)
  recordReadReceipt(
    @Param('id') id: string,
    @Param('msgId') msgId: string,
    @Request() req: any,
  ) {
    return this.service.recordReadReceipt(id, msgId, req.user.id)
  }

  // ─── Documents ───────────────────────────────────────────────────────────────

  @Post(':id/documents')
  @UseGuards(ParticipantGuard)
  getSignedUploadUrl(
    @Param('id') id: string,
    @Body() dto: UploadDocumentDto,
    @Request() req: any,
  ) {
    return this.service.getSignedUploadUrl(id, dto, req.user.id, req.participantRole)
  }

  @Get(':id/documents')
  @UseGuards(ParticipantGuard)
  listDocuments(@Param('id') id: string) {
    return this.service.listDocuments(id)
  }

  @Get(':id/documents/:docId/url')
  @UseGuards(ParticipantGuard)
  getSignedDownloadUrl(@Param('id') id: string, @Param('docId') docId: string) {
    return this.service.getSignedDownloadUrl(id, docId)
  }

  @Delete(':id/documents/:docId')
  @UseGuards(ParticipantGuard)
  deleteDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Request() req: any,
  ) {
    return this.service.deleteDocument(id, docId, req.user.id, req.participantRole)
  }

  // ─── Checklist ───────────────────────────────────────────────────────────────

  @Get(':id/checklist')
  @UseGuards(ParticipantGuard)
  getChecklist(@Param('id') id: string) {
    return this.service.getChecklist(id)
  }

  @Patch(':id/checklist/:itemId')
  @UseGuards(ParticipantGuard, RoleGuard)
  @RoomRoles('realtor', 'seller')
  updateChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistDto,
    @Request() req: any,
  ) {
    return this.service.updateChecklistItem(id, itemId, dto, req.user.id, req.participantRole)
  }

  @Post(':id/checklist')
  @UseGuards(ParticipantGuard, RoleGuard)
  @RoomRoles('realtor')
  addChecklistItem(
    @Param('id') id: string,
    @Body() dto: AddChecklistItemDto,
    @Request() req: any,
  ) {
    return this.service.addChecklistItem(id, dto, req.user.id)
  }

  // ─── Status ──────────────────────────────────────────────────────────────────

  @Patch(':id/status')
  @UseGuards(ParticipantGuard, RoleGuard)
  @RoomRoles('realtor', 'seller')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req: any,
  ) {
    return this.service.updateStatus(id, dto, req.user.id, req.participantRole)
  }

  // ─── Audit ───────────────────────────────────────────────────────────────────

  @Get(':id/audit')
  @UseGuards(ParticipantGuard)
  getAuditTrail(@Param('id') id: string) {
    return this.service.getAuditTrail(id)
  }

  @Post(':id/audit/export')
  @UseGuards(ParticipantGuard)
  @HttpCode(HttpStatus.OK)
  exportAuditTrail(
    @Param('id') id: string,
    @Body() body: { format?: 'pdf' | 'csv' },
  ) {
    return this.service.exportAuditTrail(id, body.format ?? 'csv')
  }
}
