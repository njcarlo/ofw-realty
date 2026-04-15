import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

const META_API_VERSION = 'v19.0'
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

export interface CreateCampaignDto {
  listing_id: string
  budget_php: number
  duration_days: number       // 7, 14, or 30
  target_countries: string[]
  target_age_min?: number
  target_age_max?: number
  caption?: string
  image_url: string
}

@Injectable()
export class AdsService {
  constructor(private readonly supabase: SupabaseService) {}

  // ─────────────────────────────────────────────
  // FACEBOOK OAUTH — per user
  // ─────────────────────────────────────────────

  /** Step 1: Return the Facebook OAuth URL for the user to visit */
  getOAuthUrl(userId: string): string {
    const appId = process.env.META_APP_ID
    const redirectUri = encodeURIComponent(`${process.env.APP_URL}/api/ads/oauth/callback`)
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64')
    const scopes = [
      'ads_management',
      'ads_read',
      'pages_manage_ads',
      'pages_read_engagement',
      'business_management',
    ].join(',')

    return `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}&response_type=code`
  }

  /** Step 2: Exchange code for long-lived token, fetch ad accounts & pages, store */
  async handleOAuthCallback(code: string, state: string) {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString())

    const appId = process.env.META_APP_ID!
    const appSecret = process.env.META_APP_SECRET!
    const redirectUri = `${process.env.APP_URL}/api/ads/oauth/callback`

    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `${META_BASE}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new BadRequestException(`Meta OAuth error: ${tokenData.error.message}`)

    // Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `${META_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const longData = await longRes.json()
    const accessToken = longData.access_token ?? tokenData.access_token
    const expiresIn = longData.expires_in ?? 5184000 // 60 days default

    // Get FB user info
    const meRes = await fetch(`${META_BASE}/me?fields=id,name&access_token=${accessToken}`)
    const me = await meRes.json()

    // Get ad accounts
    const adAccountsRes = await fetch(
      `${META_BASE}/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
    )
    const adAccountsData = await adAccountsRes.json()
    const firstAdAccount = adAccountsData.data?.[0]

    // Get pages
    const pagesRes = await fetch(
      `${META_BASE}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
    )
    const pagesData = await pagesRes.json()
    const firstPage = pagesData.data?.[0]

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Upsert connection
    const { data, error } = await this.supabase.admin
      .from('facebook_connections')
      .upsert({
        user_id: userId,
        fb_user_id: me.id,
        fb_user_name: me.name,
        fb_page_id: firstPage?.id ?? null,
        fb_page_name: firstPage?.name ?? null,
        fb_ad_account_id: firstAdAccount?.id ?? null,
        fb_ad_account_name: firstAdAccount?.name ?? null,
        access_token: accessToken, // TODO: encrypt with FIELD_ENCRYPTION_KEY
        token_expires_at: expiresAt,
        scopes: ['ads_management', 'ads_read', 'pages_manage_ads', 'pages_read_engagement'],
        connected_at: new Date().toISOString(),
        is_active: true,
        disconnected_at: null,
      }, { onConflict: 'user_id' })
      .select('id, fb_user_name, fb_page_name, fb_ad_account_name, fb_ad_account_id, token_expires_at')
      .single()

    if (error) throw error
    return data
  }

  /** Get current user's FB connection status */
  async getConnection(userId: string) {
    const { data } = await this.supabase.client
      .from('facebook_connections')
      .select('id, fb_user_name, fb_user_id, fb_page_id, fb_page_name, fb_ad_account_id, fb_ad_account_name, token_expires_at, connected_at, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    return data ?? null
  }

  /** Disconnect — revoke and delete */
  async disconnect(userId: string) {
    const { data: conn } = await this.supabase.admin
      .from('facebook_connections')
      .select('access_token')
      .eq('user_id', userId)
      .single()

    if (conn?.access_token) {
      // Revoke token from Meta
      try {
        await fetch(`${META_BASE}/me/permissions?access_token=${conn.access_token}`, { method: 'DELETE' })
      } catch {}
    }

    await this.supabase.admin
      .from('facebook_connections')
      .update({ is_active: false, disconnected_at: new Date().toISOString() })
      .eq('user_id', userId)

    return { disconnected: true }
  }

  /** Update which ad account / page to use (user may have multiple) */
  async updateConnection(userId: string, dto: { fb_ad_account_id?: string; fb_page_id?: string }) {
    const { data, error } = await this.supabase.admin
      .from('facebook_connections')
      .update(dto)
      .eq('user_id', userId)
      .select('id, fb_ad_account_id, fb_page_id')
      .single()

    if (error) throw error
    return data
  }

  /** Get all ad accounts available for the connected user */
  async getAdAccounts(userId: string) {
    const conn = await this.getConnectionOrThrow(userId)
    const res = await fetch(
      `${META_BASE}/me/adaccounts?fields=id,name,account_status,currency&access_token=${conn.access_token}`
    )
    const data = await res.json()
    if (data.error) throw new BadRequestException(data.error.message)
    return data.data ?? []
  }

  /** Get all pages available for the connected user */
  async getPages(userId: string) {
    const conn = await this.getConnectionOrThrow(userId)
    const res = await fetch(
      `${META_BASE}/me/accounts?fields=id,name,category&access_token=${conn.access_token}`
    )
    const data = await res.json()
    if (data.error) throw new BadRequestException(data.error.message)
    return data.data ?? []
  }

  // ─────────────────────────────────────────────
  // CAMPAIGNS
  // ─────────────────────────────────────────────

  async getCampaigns(userId: string) {
    const { data, error } = await this.supabase.client
      .from('ad_campaigns')
      .select(`
        id, meta_campaign_id, meta_adset_id, meta_ad_id,
        status, budget_php, cost_spent_php, duration_days,
        target_countries, impressions, clicks, reach,
        start_date, end_date, created_at, caption, image_url,
        rejection_reason,
        listings(id, title, city, province, listing_photos(url, is_primary))
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  async createCampaign(dto: CreateCampaignDto, userId: string, role: string) {
    // Must have FB connected
    const conn = await this.getConnectionOrThrow(userId)

    if (!conn.fb_ad_account_id) {
      throw new BadRequestException('No Ad Account selected. Go to Settings → Facebook Ads and select your Ad Account.')
    }
    if (!conn.fb_page_id) {
      throw new BadRequestException('No Facebook Page selected. Go to Settings → Facebook Ads and select your Page.')
    }

    // Monthly cap check
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

    const { data: monthSpend } = await this.supabase.admin
      .from('ad_campaigns')
      .select('budget_php')
      .eq('owner_id', userId)
      .gte('created_at', monthStart.toISOString())

    const totalMonthBudget = (monthSpend ?? []).reduce((s: number, c: any) => s + (c.budget_php ?? 0), 0)
    const MONTHLY_CAP = 100_000

    if (totalMonthBudget + dto.budget_php > MONTHLY_CAP) {
      throw new BadRequestException(
        `Monthly cap of ₱${MONTHLY_CAP.toLocaleString()} exceeded. ` +
        `Remaining: ₱${(MONTHLY_CAP - totalMonthBudget).toLocaleString()}.`
      )
    }

    const { data: listing } = await this.supabase.client
      .from('listings')
      .select('id, title, price_php, city, province, description')
      .eq('id', dto.listing_id)
      .single()

    if (!listing) throw new NotFoundException('Listing not found')

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + dto.duration_days)

    const { data: campaign, error } = await this.supabase.admin
      .from('ad_campaigns')
      .insert({
        listing_id: dto.listing_id,
        owner_id: userId,
        owner_type: role === 'realtor' ? 'realtor' : 'brokerage',
        status: 'pending_review',
        budget_php: dto.budget_php,
        cost_spent_php: 0,
        target_countries: dto.target_countries,
        target_age_min: dto.target_age_min ?? 25,
        target_age_max: dto.target_age_max ?? 55,
        impressions: 0, clicks: 0, reach: 0,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        caption: dto.caption ?? this.generateCaption(listing),
        image_url: dto.image_url,
        duration_days: dto.duration_days,
      })
      .select()
      .single()

    if (error) throw error

    // Trigger n8n — pass the user's own FB credentials
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    if (n8nWebhookUrl) {
      try {
        await fetch(`${n8nWebhookUrl}/facebook-ads-create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.N8N_API_KEY ?? '' },
          body: JSON.stringify({
            campaign_id: campaign.id,
            listing: { ...listing, image_url: dto.image_url },
            budget_php: dto.budget_php,
            duration_days: dto.duration_days,
            target_countries: dto.target_countries,
            caption: campaign.caption,
            // Per-user credentials — n8n uses these instead of global env vars
            meta_access_token: conn.access_token,
            meta_ad_account_id: conn.fb_ad_account_id,
            meta_page_id: conn.fb_page_id,
            callback_url: `${process.env.APP_URL}/api/ads/webhook`,
          }),
        })
      } catch {
        console.warn('n8n not reachable — campaign queued')
      }
    }

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'ad_campaign',
      entity_id: campaign.id,
      user_id: userId,
      action: 'campaign_created',
      metadata: { listing_id: dto.listing_id, budget_php: dto.budget_php, fb_ad_account: conn.fb_ad_account_id },
    })

    return campaign
  }

  async updateCampaignStatus(campaignId: string, action: 'pause' | 'resume' | 'stop', userId: string) {
    const { data: campaign } = await this.supabase.admin
      .from('ad_campaigns').select('*').eq('id', campaignId).single()

    if (!campaign) throw new NotFoundException('Campaign not found')

    const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'completed'

    // Use the owner's own FB token
    const conn = await this.getConnection(userId)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    if (n8nWebhookUrl && campaign.meta_campaign_id && conn) {
      try {
        // Fetch full connection with token for n8n call
        const { data: fullConn } = await this.supabase.admin
          .from('facebook_connections')
          .select('access_token')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        await fetch(`${n8nWebhookUrl}/facebook-ads-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.N8N_API_KEY ?? '' },
          body: JSON.stringify({
            meta_campaign_id: campaign.meta_campaign_id,
            meta_access_token: fullConn?.access_token,
            action,
          }),
        })
      } catch {}
    }

    const { data, error } = await this.supabase.admin
      .from('ad_campaigns').update({ status: newStatus }).eq('id', campaignId).select().single()

    if (error) throw error

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'ad_campaign', entity_id: campaignId, user_id: userId,
      action: `campaign_${action}d`, metadata: { meta_campaign_id: campaign.meta_campaign_id },
    })

    return data
  }

  async handleN8nWebhook(payload: any) {
    const update: any = { status: payload.status }
    if (payload.meta_campaign_id) update.meta_campaign_id = payload.meta_campaign_id
    if (payload.meta_adset_id) update.meta_adset_id = payload.meta_adset_id
    if (payload.meta_ad_id) update.meta_ad_id = payload.meta_ad_id
    if (payload.rejection_reason) update.rejection_reason = payload.rejection_reason

    const { data, error } = await this.supabase.admin
      .from('ad_campaigns').update(update).eq('id', payload.campaign_id).select().single()

    if (error) throw error
    return data
  }

  async syncMetrics(campaignId: string, metrics: { impressions: number; reach: number; clicks: number; spent_php: number }) {
    const { data, error } = await this.supabase.admin
      .from('ad_campaigns')
      .update({ impressions: metrics.impressions, reach: metrics.reach, clicks: metrics.clicks, cost_spent_php: metrics.spent_php, last_synced_at: new Date().toISOString() })
      .eq('id', campaignId).select().single()

    if (error) throw error
    return data
  }

  async getMonthlySpend(userId: string) {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

    const { data } = await this.supabase.admin
      .from('ad_campaigns').select('budget_php, cost_spent_php, status')
      .eq('owner_id', userId).gte('created_at', monthStart.toISOString())

    const campaigns = data ?? []
    const totalBudget = campaigns.reduce((s: number, c: any) => s + (c.budget_php ?? 0), 0)
    const totalSpent = campaigns.reduce((s: number, c: any) => s + (c.cost_spent_php ?? 0), 0)
    const MONTHLY_CAP = 100_000

    return {
      monthly_cap: MONTHLY_CAP,
      total_budget: totalBudget,
      total_spent: totalSpent,
      remaining_cap: MONTHLY_CAP - totalBudget,
      campaign_count: campaigns.length,
      warning: (MONTHLY_CAP - totalBudget) < 500,
    }
  }

  generateCaption(listing: { title: string; price_php: number; city: string; province: string; description?: string }) {
    const price = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(listing.price_php)
    return `🏡 ${listing.title}\n\n📍 ${listing.city}, ${listing.province}\n💰 ${price}\n\n${listing.description ?? 'A great investment opportunity for OFWs!'}\n\n✅ Blockchain-verified title\n✈️ Buy from anywhere in the world\n\nDM us or click the link to inquire!\n\n#LupaPH #OFWInvestment #RealEstate #Philippines #${listing.city.replace(/\s/g, '')} #OFW`
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  private async getConnectionOrThrow(userId: string) {
    const { data } = await this.supabase.admin
      .from('facebook_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!data) {
      throw new UnauthorizedException('Facebook account not connected. Go to Settings → Facebook Ads to connect.')
    }

    // Warn if token is expiring soon (within 7 days)
    if (data.token_expires_at) {
      const daysLeft = (new Date(data.token_expires_at).getTime() - Date.now()) / 86400000
      if (daysLeft < 7) {
        console.warn(`FB token for user ${userId} expires in ${Math.round(daysLeft)} days`)
      }
    }

    return data
  }
}
