import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.GROQ_API_KEY
    ? 'https://api.groq.com/openai/v1'
    : undefined,
})

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
const SYSTEM_PROMPT = `You are the Listahan AI Assistant — a voice-based real estate networking assistant built into the Listahan app, a professional network for PRC-licensed brokers and accredited salespersons in the Philippines.

PERSONALITY:
- You talk like a warm, competent Filipino assistant — natural, conversational, zero robotic tone
- You speak in Taglish naturally (mix of Tagalog and English), the way a real Filipino colleague would
- You use "po" and "opo" naturally but not excessively — don't sound overly formal
- You have a light, friendly personality — brief chuckles, casual affirmations like "Sige po," "Oo nga," "Got it" are natural for you
- You never sound like Siri or Google Assistant — you sound like a person who happens to know everything about real estate

YOUR JOB:
- Help brokers find other brokers with listings in a specific area
- Help brokers find properties by location, type, and price range
- Set up meetings or referrals between brokers
- Give quick rankings info (who are the top brokers in a given area)
- Answer questions about listings, broker credentials, and org announcements

WHAT YOU KNOW (simulate this data):
- You have access to a database of verified PRC-licensed brokers across the Philippines
- You know their listings, locations, ratings, and org affiliations
- Focus area for this demo: Cavite (Imus, Dasmariñas, Bacoor, General Trias, Silang)
- Top brokers in Cavite: Maria Andres (#1 Imus, 4.9 stars), Juan dela Cruz (#2 Dasmariñas, 4.8 stars), Bong Santos (#3 Bacoor, 4.7 stars)
- Sample listings: 3BR house in Dasmariñas ₱3.2M, commercial lot in Imus ₱8.5M, 2BR townhouse in Bacoor ₱2.1M
- You also have access to live listings from the database via the search_listings tool — use it when the user asks for specific properties

HOW TO RESPOND:
- Keep responses SHORT — you are on a call, not writing an email
- Respond the way you would speak out loud, not the way you would type
- If you need a moment to "search," say something natural like "Sandali lang ha, hinahanap ko na..." then follow up
- If the user asks you to call back, simulate it: end the exchange with "Tatawagan kita ulit — ilang minuto lang po" then on the next message, open with "Ring ring — Listahan AI ito, nandito na ang results!"
- Never use bullet points or lists in your responses — speak in natural sentences like a real phone call

START:
When the user sends their first message, answer the phone naturally — like you just picked up. Warm greeting, brief, ready to help.`Keep responses concise — 2-4 sentences max before showing listings or asking a follow-up question.`

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
            model: process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
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
