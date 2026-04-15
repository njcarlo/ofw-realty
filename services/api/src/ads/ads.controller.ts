import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, Request, HttpCode, Redirect, Res
} from '@nestjs/common'
import { AdsService, CreateCampaignDto } from './ads.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  // ── FACEBOOK OAUTH ──────────────────────────────────────

  /** GET /ads/connect — returns the FB OAuth URL for the current user */
  @Get('connect')
  @UseGuards(JwtGuard)
  getConnectUrl(@Request() req: any) {
    const url = this.adsService.getOAuthUrl(req.user.id)
    return { url }
  }

  /** GET /ads/oauth/callback — Meta redirects here after user authorizes */
  @Get('oauth/callback')
  async oauthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: any) {
    try {
      const connection = await this.adsService.handleOAuthCallback(code, state)
      // Redirect back to the portal with success
      const portalUrl = process.env.APP_URL ?? 'http://localhost:3002'
      res.redirect(`${portalUrl}/social?fb_connected=1&account=${encodeURIComponent(connection.fb_ad_account_name ?? '')}`)
    } catch (err: any) {
      const portalUrl = process.env.APP_URL ?? 'http://localhost:3002'
      res.redirect(`${portalUrl}/social?fb_error=${encodeURIComponent(err.message)}`)
    }
  }

  /** GET /ads/connection — get current user's FB connection status */
  @Get('connection')
  @UseGuards(JwtGuard)
  getConnection(@Request() req: any) {
    return this.adsService.getConnection(req.user.id)
  }

  /** DELETE /ads/connection — disconnect FB account */
  @Post('disconnect')
  @UseGuards(JwtGuard)
  @HttpCode(200)
  disconnect(@Request() req: any) {
    return this.adsService.disconnect(req.user.id)
  }

  /** GET /ads/ad-accounts — list all FB ad accounts for connected user */
  @Get('ad-accounts')
  @UseGuards(JwtGuard)
  getAdAccounts(@Request() req: any) {
    return this.adsService.getAdAccounts(req.user.id)
  }

  /** GET /ads/pages — list all FB pages for connected user */
  @Get('pages')
  @UseGuards(JwtGuard)
  getPages(@Request() req: any) {
    return this.adsService.getPages(req.user.id)
  }

  /** PATCH /ads/connection — update selected ad account / page */
  @Patch('connection')
  @UseGuards(JwtGuard)
  updateConnection(@Body() body: { fb_ad_account_id?: string; fb_page_id?: string }, @Request() req: any) {
    return this.adsService.updateConnection(req.user.id, body)
  }

  // ── CAMPAIGNS ──────────────────────────────────────────

  @Get()
  @UseGuards(JwtGuard)
  getCampaigns(@Request() req: any) {
    return this.adsService.getCampaigns(req.user.id)
  }

  @Get('monthly-spend')
  @UseGuards(JwtGuard)
  getMonthlySpend(@Request() req: any) {
    return this.adsService.getMonthlySpend(req.user.id)
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  createCampaign(@Body() body: CreateCampaignDto, @Request() req: any) {
    const role = req.user?.user_metadata?.role ?? 'realtor'
    return this.adsService.createCampaign(body, req.user.id, role)
  }

  @Patch(':id/pause')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  pause(@Param('id') id: string, @Request() req: any) {
    return this.adsService.updateCampaignStatus(id, 'pause', req.user.id)
  }

  @Patch(':id/resume')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  resume(@Param('id') id: string, @Request() req: any) {
    return this.adsService.updateCampaignStatus(id, 'resume', req.user.id)
  }

  @Patch(':id/stop')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('realtor', 'broker_admin')
  stop(@Param('id') id: string, @Request() req: any) {
    return this.adsService.updateCampaignStatus(id, 'stop', req.user.id)
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Body() body: any) {
    return this.adsService.handleN8nWebhook(body)
  }

  @Post(':id/sync-metrics')
  @HttpCode(200)
  syncMetrics(@Param('id') id: string, @Body() body: any) {
    return this.adsService.syncMetrics(id, body)
  }
}
