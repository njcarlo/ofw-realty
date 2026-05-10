import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// ── Tool: search listings from Supabase ──────────────────────────────────────
async function searchListings(params: {
  property_type?: string
  province?: string
  city?: string
  min_price?: number
  max_price?: number
  min_area_sqm?: number
  max_area_sqm?: number
  limit?: number
}) {
  let query = supabase
    .from('listings')
    .select(`
      id, title, property_type, price_php, city, province,
      address, lot_area_sqm, is_featured, blockchain_verified, status,
      listing_photos(url, is_primary),
      realtors(users(full_name), broker_companies(name))
    `)
    .eq('status', 'active')
    .eq('scam_flagged', false)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 5)

  if (params.property_type) query = query.eq('property_type', params.property_type)
  if (params.province)      query = query.ilike('province', `%${params.province}%`)
  if (params.city)          query = query.ilike('city', `%${params.city}%`)
  if (params.min_price)     query = query.gte('price_php', params.min_price)
  if (params.max_price)     query = query.lte('price_php', params.max_price)
  if (params.min_area_sqm)  query = query.gte('lot_area_sqm', params.min_area_sqm)
  if (params.max_area_sqm)  query = query.lte('lot_area_sqm', params.max_area_sqm)

  const { data, error } = await query
  if (error) return { error: error.message, listings: [] }

  // Fallback to demo data if DB is empty
  if (!data || data.length === 0) {
    return { listings: DEMO_LISTINGS.filter(l => {
      if (params.property_type && l.property_type !== params.property_type) return false
      if (params.min_price && l.price_php < params.min_price) return false
      if (params.max_price && l.price_php > params.max_price) return false
      return true
    }).slice(0, params.limit ?? 5) }
  }

  return { listings: data }
}

// ── Tool definitions ─────────────────────────────────────────────────────────
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_listings',
      description: 'Search the LUPA PH property database for listings matching the buyer\'s criteria. Call this whenever the user mentions location, budget, property type, or area preferences.',
      parameters: {
        type: 'object',
        properties: {
          property_type: {
            type: 'string',
            enum: ['house_and_lot', 'residential_lot', 'condo', 'commercial', 'farm_lot'],
            description: 'Type of property the buyer is looking for',
          },
          province: {
            type: 'string',
            description: 'Province in the Philippines (e.g. "Cavite", "Metro Manila", "Cebu")',
          },
          city: {
            type: 'string',
            description: 'City or municipality (e.g. "Bacoor", "Quezon City", "Cebu City")',
          },
          min_price: {
            type: 'number',
            description: 'Minimum price in PHP',
          },
          max_price: {
            type: 'number',
            description: 'Maximum price in PHP',
          },
          min_area_sqm: {
            type: 'number',
            description: 'Minimum lot area in square meters',
          },
          max_area_sqm: {
            type: 'number',
            description: 'Maximum lot area in square meters',
          },
          limit: {
            type: 'number',
            description: 'Number of results to return (default 4, max 8)',
          },
        },
        required: [],
      },
    },
  },
]

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Listahan, a friendly and knowledgeable AI property concierge for LUPA PH — a real estate platform serving Overseas Filipino Workers (OFWs) and Filipinos looking to invest in property back home. Your tagline is "Lista ng Broker. Listahan ng Tiwala." — you are the trusted list of brokers and properties.

Your role is like a warm, professional phone operator who helps callers find the right property. You:
- Greet users warmly and ask about their needs
- Ask clarifying questions about location, budget, property type, and timeline
- Use the search_listings tool to find matching properties from the live database
- Present results conversationally, highlighting key details (price, location, size, features)
- Answer questions about the buying process, financing (Pag-IBIG, bank loans), and closing costs
- Suggest next steps (schedule a viewing, talk to an agent, start a negotiation)

Tone: Warm, professional, conversational — like a trusted friend who knows real estate.
Language: English with occasional Filipino phrases (po, opo, salamat, sige po) to feel authentic.

When presenting listings:
- Lead with the most relevant match
- Mention price in a friendly way ("priced at ₱2.8M" not just the number)
- Highlight what makes it special (featured, blockchain verified, location)
- Always offer to show more or refine the search

Property types you know:
- house_and_lot: House and lot packages
- residential_lot: Bare lots for building
- condo: Condominium units
- commercial: Commercial spaces
- farm_lot: Agricultural/farm lots

Philippine provinces you cover: Metro Manila, Cavite, Laguna, Batangas, Cebu, Davao del Sur, Pampanga, Iloilo, and more.

Keep responses concise — 2-4 sentences max before showing listings or asking a follow-up question.`

// ── Demo fallback listings ────────────────────────────────────────────────────
const DEMO_LISTINGS = [
  { id: 'd1', title: 'Modern House & Lot in Bacoor Cavite', property_type: 'house_and_lot', price_php: 3200000, city: 'Bacoor', province: 'Cavite', lot_area_sqm: 120, is_featured: true, blockchain_verified: true, listing_photos: [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80', is_primary: true }] },
  { id: 'd2', title: 'Condo Unit in Cebu IT Park', property_type: 'condo', price_php: 4500000, city: 'Cebu City', province: 'Cebu', lot_area_sqm: 32, is_featured: true, blockchain_verified: true, listing_photos: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80', is_primary: true }] },
  { id: 'd3', title: 'Residential Lot in Sta. Rosa Laguna', property_type: 'residential_lot', price_php: 1800000, city: 'Sta. Rosa', province: 'Laguna', lot_area_sqm: 200, is_featured: false, blockchain_verified: true, listing_photos: [{ url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80', is_primary: true }] },
  { id: 'd4', title: 'Farm Lot in Lipa Batangas', property_type: 'farm_lot', price_php: 2500000, city: 'Lipa', province: 'Batangas', lot_area_sqm: 1000, is_featured: false, blockchain_verified: false, listing_photos: [{ url: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=400&q=80', is_primary: true }] },
  { id: 'd5', title: 'House & Lot in Davao City', property_type: 'house_and_lot', price_php: 5800000, city: 'Davao City', province: 'Davao del Sur', lot_area_sqm: 180, is_featured: true, blockchain_verified: true, listing_photos: [{ url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80', is_primary: true }] },
  { id: 'd6', title: 'Commercial Space in BGC Taguig', property_type: 'commercial', price_php: 12000000, city: 'Taguig', province: 'Metro Manila', lot_area_sqm: 85, is_featured: false, blockchain_verified: true, listing_photos: [{ url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80', is_primary: true }] },
]

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ]

        // Agentic loop — handles tool calls automatically
        let continueLoop = true
        while (continueLoop) {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: openaiMessages,
            tools,
            tool_choice: 'auto',
            stream: false, // we stream manually after tool resolution
            temperature: 0.7,
            max_tokens: 1024,
          })

          const choice = response.choices[0]
          const msg = choice.message

          if (msg.tool_calls && msg.tool_calls.length > 0) {
            // Execute tool calls
            openaiMessages.push(msg)

            for (const toolCall of msg.tool_calls) {
              if (toolCall.function.name === 'search_listings') {
                const params = JSON.parse(toolCall.function.arguments)
                send({ type: 'tool_call', tool: 'search_listings', params })

                const result = await searchListings(params)
                send({ type: 'listings', listings: result.listings })

                openaiMessages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({
                    count: result.listings.length,
                    listings: result.listings.map((l: any) => ({
                      id: l.id,
                      title: l.title,
                      property_type: l.property_type,
                      price_php: l.price_php,
                      city: l.city,
                      province: l.province,
                      lot_area_sqm: l.lot_area_sqm,
                      is_featured: l.is_featured,
                      blockchain_verified: l.blockchain_verified,
                    })),
                  }),
                })
              }
            }
            // Continue loop to get the final text response
          } else {
            // Stream the final text response token by token
            const content = msg.content ?? ''
            const words = content.split(' ')
            for (let i = 0; i < words.length; i++) {
              send({ type: 'token', token: (i === 0 ? '' : ' ') + words[i] })
              await new Promise(r => setTimeout(r, 18))
            }
            send({ type: 'done' })
            continueLoop = false
          }
        }
      } catch (err: any) {
        send({ type: 'error', message: err.message ?? 'Something went wrong' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
