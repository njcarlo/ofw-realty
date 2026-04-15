import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

const EMBASSIES = [
  { country: 'UAE', city: 'Abu Dhabi', name: 'Philippine Embassy in Abu Dhabi', address: 'Villa No. 11, Ahmed Hilal Street, Khalidiyah, Abu Dhabi', phone: '+971-2-635-4212', hours: 'Mon-Fri 8:00AM-5:00PM GST' },
  { country: 'UAE', city: 'Dubai', name: 'Philippine Consulate General in Dubai', address: 'Emarat Atrium Building, Sheikh Zayed Road, Dubai', phone: '+971-4-220-7100', hours: 'Mon-Fri 8:00AM-5:00PM GST' },
  { country: 'Saudi Arabia', city: 'Riyadh', name: 'Philippine Embassy in Riyadh', address: 'Diplomatic Quarter, Riyadh', phone: '+966-11-488-0001', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Saudi Arabia', city: 'Jeddah', name: 'Philippine Consulate General in Jeddah', address: 'Al-Hamra District, Jeddah', phone: '+966-12-665-0001', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Singapore', city: 'Singapore', name: 'Philippine Embassy in Singapore', address: '20 Nassim Road, Singapore 258395', phone: '+65-6737-3977', hours: 'Mon-Fri 8:30AM-5:30PM SGT' },
  { country: 'Hong Kong', city: 'Hong Kong', name: 'Philippine Consulate General in Hong Kong', address: 'United Centre, 95 Queensway, Admiralty, Hong Kong', phone: '+852-2823-8500', hours: 'Mon-Fri 8:30AM-5:30PM HKT' },
  { country: 'Qatar', city: 'Doha', name: 'Philippine Embassy in Doha', address: 'Al Hilal Area, Doha', phone: '+974-4467-0010', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Kuwait', city: 'Kuwait City', name: 'Philippine Embassy in Kuwait', address: 'Block 1, Street 12, Rumaithiya, Kuwait City', phone: '+965-2531-0900', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Italy', city: 'Rome', name: 'Philippine Embassy in Rome', address: "Viale delle Medaglie d'Oro 112, Rome", phone: '+39-06-3975-0671', hours: 'Mon-Fri 9:00AM-5:00PM CET' },
  { country: 'Japan', city: 'Tokyo', name: 'Philippine Embassy in Tokyo', address: '5-15-5 Roppongi, Minato-ku, Tokyo', phone: '+81-3-5562-1600', hours: 'Mon-Fri 8:30AM-5:30PM JST' },
  { country: 'South Korea', city: 'Seoul', name: 'Philippine Embassy in Seoul', address: '5-1 Itaewon-dong, Yongsan-gu, Seoul', phone: '+82-2-577-6147', hours: 'Mon-Fri 8:30AM-5:30PM KST' },
  { country: 'USA', city: 'Washington DC', name: 'Philippine Embassy in Washington DC', address: '1600 Massachusetts Avenue NW, Washington DC', phone: '+1-202-467-9300', hours: 'Mon-Fri 9:00AM-5:00PM EST' },
  { country: 'USA', city: 'Los Angeles', name: 'Philippine Consulate General in Los Angeles', address: '3600 Wilshire Blvd, Suite 500, Los Angeles', phone: '+1-213-639-0980', hours: 'Mon-Fri 8:00AM-5:00PM PST' },
  { country: 'Canada', city: 'Ottawa', name: 'Philippine Embassy in Ottawa', address: '130 Albert Street, Suite 606, Ottawa', phone: '+1-613-233-1121', hours: 'Mon-Fri 9:00AM-5:00PM EST' },
  { country: 'Australia', city: 'Canberra', name: 'Philippine Embassy in Canberra', address: '1 Moonah Place, Yarralumla, Canberra', phone: '+61-2-6273-2535', hours: 'Mon-Fri 8:30AM-4:30PM AEST' },
  { country: 'UK', city: 'London', name: 'Philippine Embassy in London', address: '6-11 Suffolk Street, London SW1Y 4HG', phone: '+44-20-7451-1780', hours: 'Mon-Fri 9:00AM-5:00PM GMT' },
  { country: 'Bahrain', city: 'Manama', name: 'Philippine Embassy in Manama', address: 'Villa 939, Road 3220, Block 332, Manama', phone: '+973-1727-2700', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Oman', city: 'Muscat', name: 'Philippine Embassy in Muscat', address: 'Way 3017, Shatti Al Qurum, Muscat', phone: '+968-2469-5900', hours: 'Sun-Thu 8:00AM-4:00PM GST' },
]

@Injectable()
export class SpaService {
  constructor(private readonly supabase: SupabaseService) {}

  searchEmbassies(query: string) {
    if (!query) return EMBASSIES.slice(0, 10)
    const q = query.toLowerCase()
    return EMBASSIES.filter(e =>
      e.country.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q)
    )
  }

  async generateSpaTemplate(buyerId: string, listingId: string) {
    const [{ data: buyer }, { data: listing }] = await Promise.all([
      this.supabase.client.from('users').select('full_name, email').eq('id', buyerId).single(),
      this.supabase.client.from('listings').select('title, address, city, province, tct_number_enc').eq('id', listingId).single(),
    ])

    return {
      buyer_name: buyer?.full_name,
      listing_title: listing?.title,
      template_url: `/api/spa/template?listing_id=${listingId}`,
      generated_at: new Date().toISOString(),
    }
  }

  async uploadSpa(dto: { listing_id: string; file_url: string; realtor_id: string }, buyerId: string) {
    const { data, error } = await this.supabase.admin
      .from('documents')
      .insert({
        owner_id: buyerId,
        owner_type: 'transaction',
        doc_type: 'spa_notarized',
        file_url: dto.file_url,
        status: 'submitted',
      })
      .select()
      .single()

    if (error) throw error

    await this.supabase.admin.from('notifications').insert({
      user_id: dto.realtor_id,
      type: 'spa_uploaded',
      title: 'SPA uploaded by buyer',
      body: 'The buyer has uploaded their notarized Special Power of Attorney.',
      data: { listing_id: dto.listing_id, document_id: data.id },
    })

    return { message: 'SPA uploaded successfully', document_id: data.id }
  }
}
