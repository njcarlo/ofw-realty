import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class TokensService {
  constructor(private readonly supabase: SupabaseService) {}

  async listTokenizedProperties() {
    const { data, error } = await this.supabase.client
      .from('tokenized_properties')
      .select(`
        id, total_shares, price_per_share, available_shares,
        blockchain_ref, created_at,
        listings(id, title, city, province, listing_photos(url, is_primary))
      `)
      .gt('available_shares', 0)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async buyShares(tokenId: string, buyerId: string, sharesToBuy: number) {
    // Get current token state
    const { data: token } = await this.supabase.admin
      .from('tokenized_properties')
      .select('*')
      .eq('id', tokenId)
      .single()

    if (!token) throw new NotFoundException('Tokenized property not found')

    // Property P6: Token Supply Conservation — shares_owned never exceeds total_shares
    if (sharesToBuy > token.available_shares) {
      throw new BadRequestException(
        `Only ${token.available_shares} shares available. Cannot purchase ${sharesToBuy}.`
      )
    }

    // Check existing holding
    const { data: existing } = await this.supabase.admin
      .from('token_holdings')
      .select('id, shares_owned')
      .eq('tokenized_property_id', tokenId)
      .eq('buyer_id', buyerId)
      .single()

    if (existing) {
      await this.supabase.admin
        .from('token_holdings')
        .update({ shares_owned: existing.shares_owned + sharesToBuy })
        .eq('id', existing.id)
    } else {
      await this.supabase.admin
        .from('token_holdings')
        .insert({ tokenized_property_id: tokenId, buyer_id: buyerId, shares_owned: sharesToBuy })
    }

    // Decrement available shares
    await this.supabase.admin
      .from('tokenized_properties')
      .update({ available_shares: token.available_shares - sharesToBuy })
      .eq('id', tokenId)

    // TODO: call Hyperledger Fabric mintTokens / transferToken chaincode

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'token_purchase',
      entity_id: tokenId,
      user_id: buyerId,
      action: 'shares_purchased',
      metadata: { shares: sharesToBuy, price_per_share: token.price_per_share, total: sharesToBuy * token.price_per_share },
    })

    return { message: `${sharesToBuy} share(s) purchased successfully`, blockchain_pending: true }
  }

  async distributeIncome(tokenId: string, adminId: string) {
    const { data: token } = await this.supabase.admin
      .from('tokenized_properties')
      .select('*, token_holdings(*)')
      .eq('id', tokenId)
      .single()

    if (!token) throw new NotFoundException('Tokenized property not found')

    // Use a default monthly rent estimate if not stored on token
    const monthlyRent = 30000
    const netIncome = monthlyRent * (1 - 0.08) // 8% management fee
    const distributions = (token.token_holdings ?? []).map((h: any) => ({
      holder_id: h.buyer_id,
      shares: h.shares_owned,
      ownership_pct: h.shares_owned / token.total_shares,
      income: Math.floor((h.shares_owned / token.total_shares) * netIncome),
    }))

    await this.supabase.admin.from('audit_trail').insert({
      entity_type: 'token_distribution',
      entity_id: tokenId,
      user_id: adminId,
      action: 'income_distributed',
      metadata: { net_income: netIncome, holder_count: distributions.length },
    })

    return { distributions, net_income: netIncome, management_fee: monthlyRent * 0.08 }
  }

  async getMyHoldings(buyerId: string) {
    const { data, error } = await this.supabase.client
      .from('token_holdings')
      .select(`
        id, shares_owned, created_at,
        tokenized_properties(id, total_shares, price_per_share, available_shares,
          listings(title, city, province))
      `)
      .eq('buyer_id', buyerId)

    if (error) throw error
    return data
  }
}
