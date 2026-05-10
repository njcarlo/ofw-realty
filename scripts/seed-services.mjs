/**
 * Run the services seed against the remote Supabase project.
 * Uses the service role key to bypass RLS.
 *
 * Usage: node scripts/seed-services.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env from services/api/.env
const envPath = join(__dirname, '../services/api/.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in services/api/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ── Resolve demo user IDs ──────────────────────────────────────────────────
async function getUserId(email) {
  const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  return data?.id ?? null
}

async function main() {
  console.log('🌱 Seeding services portal data...\n')

  const buyerId  = await getUserId('buyer@demo.lupaph.com')
  const sellerId = await getUserId('seller@demo.lupaph.com')
  const agentId  = await getUserId('agent@demo.lupaph.com')
  const brokerId = await getUserId('broker@demo.lupaph.com')

  console.log('Demo user IDs:')
  console.log('  buyer: ', buyerId  ?? '⚠️  not found — using fallback')
  console.log('  seller:', sellerId ?? '⚠️  not found — using fallback')
  console.log('  agent: ', agentId  ?? '⚠️  not found — using fallback')
  console.log('  broker:', brokerId ?? '⚠️  not found — using fallback')
  console.log()

  // Fallback UUIDs if demo users don't exist yet
  const buyer  = buyerId  ?? 'a1b2c3d4-0000-0000-0000-000000000010'
  const seller = sellerId ?? 'a1b2c3d4-0000-0000-0000-000000000004'
  const agent  = agentId  ?? 'a1b2c3d4-0000-0000-0000-000000000002'
  const broker = brokerId ?? 'a1b2c3d4-0000-0000-0000-000000000012'

  // ── Provider Profiles ────────────────────────────────────────────────────
  console.log('📋 Inserting provider profiles...')
  const { error: provErr } = await supabase.from('provider_profiles').upsert([
    {
      id: 'c0000001-0000-0000-0000-000000000001',
      user_id: agent,
      full_name: 'Atty. Maria Santos',
      license_number: 'PRC-2024-001234',
      license_type: 'prc',
      license_verification_status: 'verified',
      service_types: ['notarization', 'legal_consultation', 'title_transfer'],
      coverage_areas: ['Metro Manila', 'Cavite', 'Laguna'],
      bio: 'Licensed attorney with 10+ years specializing in real estate transactions, title transfers, and notarization for OFW clients. Fluent in English and Filipino.',
      contact_phone: '+63 917 123 4567',
      contact_email: 'atty.santos@demo.lupaph.com',
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
      availability: 'available',
      status: 'approved',
      is_featured: true,
      avg_rating: 4.9,
      completed_engagements: 87,
    },
    {
      id: 'c0000001-0000-0000-0000-000000000002',
      user_id: broker,
      full_name: 'Engr. Jose Reyes',
      license_number: 'PRC-2023-005678',
      license_type: 'prc',
      license_verification_status: 'verified',
      service_types: ['geodetic_survey', 'building_permit_processing'],
      coverage_areas: ['Cavite', 'Laguna', 'Batangas', 'Metro Manila'],
      bio: 'Licensed Geodetic Engineer with expertise in lot surveys, subdivision plans, and building permit processing. Serving OFW clients since 2015.',
      contact_phone: '+63 918 234 5678',
      contact_email: 'engr.reyes@demo.lupaph.com',
      photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80',
      availability: 'available',
      status: 'approved',
      is_featured: true,
      avg_rating: 4.8,
      completed_engagements: 64,
    },
    {
      id: 'c0000001-0000-0000-0000-000000000003',
      user_id: seller,
      full_name: 'Maria Cruz, MAE',
      license_number: 'PRC-2022-009012',
      license_type: 'prc',
      license_verification_status: 'verified',
      service_types: ['property_appraisal', 'property_tax_assistance'],
      coverage_areas: ['Metro Manila', 'Cebu', 'Davao'],
      bio: 'Master Appraiser of the Philippines with 15 years of experience. Specializes in residential and commercial property valuation for bank financing and estate settlement.',
      contact_phone: '+63 919 345 6789',
      contact_email: 'maria.cruz@demo.lupaph.com',
      photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
      availability: 'available',
      status: 'approved',
      is_featured: false,
      avg_rating: 4.7,
      completed_engagements: 52,
    },
    {
      id: 'c0000001-0000-0000-0000-000000000004',
      user_id: buyer,
      full_name: 'Carlo Mendoza, CPA',
      license_number: 'PRC-2021-003456',
      license_type: 'prc',
      license_verification_status: 'verified',
      service_types: ['property_tax_assistance', 'title_transfer', 'notarization'],
      coverage_areas: ['Pampanga', 'Bulacan', 'Metro Manila', 'Cavite'],
      bio: 'CPA specializing in real estate tax compliance, capital gains tax, documentary stamp tax, and BIR clearance processing. Fast turnaround for OFW clients.',
      contact_phone: '+63 920 456 7890',
      contact_email: 'carlo.mendoza@demo.lupaph.com',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      availability: 'busy',
      status: 'approved',
      is_featured: false,
      avg_rating: 4.5,
      completed_engagements: 38,
    },
  ], { onConflict: 'id' })
  if (provErr) console.error('  ❌ provider_profiles:', provErr.message)
  else console.log('  ✅ 4 provider profiles inserted')

  // ── Service Requests ─────────────────────────────────────────────────────
  console.log('📋 Inserting service requests...')
  const now = new Date()
  const { error: reqErr } = await supabase.from('service_requests').upsert([
    {
      id: 'd0000001-0000-0000-0000-000000000001',
      requester_id: buyer,
      service_type: 'title_transfer',
      description: 'I need help transferring the title of a house and lot I purchased in Bacoor, Cavite. The seller has already signed the Deed of Absolute Sale. I am currently based in Dubai and need someone who can process this on my behalf.',
      province: 'Cavite', city: 'Bacoor', barangay: 'Molino',
      preferred_timeline: '2-3 weeks',
      budget_min_php: 15000, budget_max_php: 30000,
      status: 'open', proposal_count: 2,
      expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
    },
    {
      id: 'd0000001-0000-0000-0000-000000000002',
      requester_id: buyer,
      service_type: 'property_appraisal',
      description: 'Looking for a licensed appraiser for a 200 sqm residential lot in Sta. Rosa, Laguna. Needed for bank financing purposes (BDO housing loan). Must provide a formal appraisal report.',
      province: 'Laguna', city: 'Sta. Rosa', barangay: 'Tagaytay Road',
      preferred_timeline: '1 week',
      budget_min_php: 5000, budget_max_php: 10000,
      status: 'open', proposal_count: 1,
      expires_at: new Date(Date.now() + 20 * 86400000).toISOString(),
    },
    {
      id: 'd0000001-0000-0000-0000-000000000003',
      requester_id: seller,
      service_type: 'notarization',
      description: 'Need a notary public to notarize a Special Power of Attorney (SPA) for my brother who will represent me in a property sale. I am in Saudi Arabia and will send the documents via courier.',
      province: 'Metro Manila', city: 'Makati', barangay: 'Bel-Air',
      preferred_timeline: 'ASAP',
      budget_min_php: 2000, budget_max_php: 5000,
      status: 'in_progress', proposal_count: 1,
      expires_at: new Date(Date.now() + 15 * 86400000).toISOString(),
    },
    {
      id: 'd0000001-0000-0000-0000-000000000004',
      requester_id: seller,
      service_type: 'geodetic_survey',
      description: 'Need a geodetic engineer to conduct a relocation survey for a 500 sqm lot in Calamba, Laguna. The lot has been subdivided and we need updated survey plans for the title transfer.',
      province: 'Laguna', city: 'Calamba', barangay: 'Pansol',
      preferred_timeline: '2 weeks',
      budget_min_php: 8000, budget_max_php: 15000,
      status: 'open', proposal_count: 0,
      expires_at: new Date(Date.now() + 28 * 86400000).toISOString(),
    },
    {
      id: 'd0000001-0000-0000-0000-000000000005',
      requester_id: buyer,
      service_type: 'legal_consultation',
      description: 'Needed legal advice on a property dispute involving a lot in Quezon City. The seller is claiming the title is clean but there is an annotation on the title. Needed a lawyer to review the documents.',
      province: 'Metro Manila', city: 'Quezon City', barangay: 'Batasan Hills',
      preferred_timeline: 'Flexible',
      budget_min_php: 3000, budget_max_php: 8000,
      status: 'completed', proposal_count: 1,
      expires_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'd0000001-0000-0000-0000-000000000006',
      requester_id: buyer,
      service_type: 'building_permit_processing',
      description: 'Looking for someone to process a building permit for a 2-storey residential house in General Trias, Cavite. Architectural plans are ready. Need someone familiar with the local LGU requirements.',
      province: 'Cavite', city: 'General Trias', barangay: 'Tejero',
      preferred_timeline: '1 month',
      budget_min_php: 10000, budget_max_php: 20000,
      status: 'open', proposal_count: 0,
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    },
  ], { onConflict: 'id' })
  if (reqErr) console.error('  ❌ service_requests:', reqErr.message)
  else console.log('  ✅ 6 service requests inserted')

  // ── Proposals ────────────────────────────────────────────────────────────
  console.log('📋 Inserting proposals...')
  const { error: propErr } = await supabase.from('proposals').upsert([
    {
      id: 'e0000001-0000-0000-0000-000000000001',
      request_id: 'd0000001-0000-0000-0000-000000000001',
      provider_id: 'c0000001-0000-0000-0000-000000000001',
      message: 'Good day! I am a licensed attorney specializing in title transfers for OFW clients. I can handle the entire process from BIR clearance, capital gains tax, documentary stamp tax, to the actual title transfer at the Registry of Deeds. I have a trusted liaison in Cavite who can process on-site. My fee covers all professional services; government fees are separate.',
      fee_min_php: 18000, fee_max_php: 25000,
      estimated_timeline: '2-3 weeks',
      status: 'pending',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000002',
      request_id: 'd0000001-0000-0000-0000-000000000001',
      provider_id: 'c0000001-0000-0000-0000-000000000004',
      message: 'Hello! As a CPA specializing in real estate tax compliance, I can handle the BIR side (CGT, DST, BIR clearance) and coordinate with a partner lawyer for the Registry of Deeds processing. I have processed over 30 title transfers for OFW clients this year alone. I can provide weekly status updates via email or Viber.',
      fee_min_php: 15000, fee_max_php: 22000,
      estimated_timeline: '3 weeks',
      status: 'pending',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000003',
      request_id: 'd0000001-0000-0000-0000-000000000002',
      provider_id: 'c0000001-0000-0000-0000-000000000003',
      message: 'Good day! I am a Master Appraiser of the Philippines (MAE) with extensive experience in residential lot appraisals for bank financing. I can conduct the site inspection and deliver a formal appraisal report within 5 business days. My report is accepted by all major banks including BDO, BPI, and Metrobank.',
      fee_min_php: 6000, fee_max_php: 8000,
      estimated_timeline: '5 business days',
      status: 'pending',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000004',
      request_id: 'd0000001-0000-0000-0000-000000000003',
      provider_id: 'c0000001-0000-0000-0000-000000000001',
      message: 'Hello! I can notarize your SPA. For OFW clients, I accept documents sent via courier. Once I receive the signed documents, I will notarize them and send them back within 2 business days. I will also provide a scanned copy via email immediately after notarization.',
      fee_min_php: 2500, fee_max_php: 3500,
      estimated_timeline: '3-5 business days after document receipt',
      status: 'accepted',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000005',
      request_id: 'd0000001-0000-0000-0000-000000000005',
      provider_id: 'c0000001-0000-0000-0000-000000000001',
      message: 'Good day! I can review the title and all related documents for the property in Quezon City. Annotations on titles can indicate encumbrances, liens, or adverse claims. I will provide a written legal opinion on the status of the title and recommend the appropriate course of action.',
      fee_min_php: 4000, fee_max_php: 6000,
      estimated_timeline: '3 business days',
      status: 'accepted',
    },
  ], { onConflict: 'id' })
  if (propErr) console.error('  ❌ proposals:', propErr.message)
  else console.log('  ✅ 5 proposals inserted')

  // ── Engagements ──────────────────────────────────────────────────────────
  console.log('📋 Inserting engagements...')
  const { error: engErr } = await supabase.from('engagements').upsert([
    {
      id: 'f0000001-0000-0000-0000-000000000001',
      request_id: 'd0000001-0000-0000-0000-000000000003',
      proposal_id: 'e0000001-0000-0000-0000-000000000004',
      requester_id: seller,
      provider_id: 'c0000001-0000-0000-0000-000000000001',
      status: 'active',
    },
    {
      id: 'f0000001-0000-0000-0000-000000000002',
      request_id: 'd0000001-0000-0000-0000-000000000005',
      proposal_id: 'e0000001-0000-0000-0000-000000000005',
      requester_id: buyer,
      provider_id: 'c0000001-0000-0000-0000-000000000001',
      status: 'completed',
      requester_completed_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      provider_completed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      rating_window_closes_at: new Date(Date.now() + 8 * 86400000).toISOString(),
    },
  ], { onConflict: 'id' })
  if (engErr) console.error('  ❌ engagements:', engErr.message)
  else console.log('  ✅ 2 engagements inserted')

  // ── Ratings ──────────────────────────────────────────────────────────────
  console.log('📋 Inserting ratings...')
  const { error: ratErr } = await supabase.from('ratings').upsert([
    {
      id: 'a0000007-0000-0000-0000-000000000001',
      engagement_id: 'f0000001-0000-0000-0000-000000000002',
      requester_id: buyer,
      provider_id: 'c0000001-0000-0000-0000-000000000001',
      score: 5,
      review: 'Atty. Santos was extremely professional and thorough. She reviewed the title annotations in detail and gave me a clear written opinion within 2 days. Highly recommend for OFW clients who need reliable legal advice remotely.',
    },
  ], { onConflict: 'id' })
  if (ratErr) console.error('  ❌ ratings:', ratErr.message)
  else console.log('  ✅ 1 rating inserted')

  // ── Engagement Messages ───────────────────────────────────────────────────
  console.log('📋 Inserting engagement messages...')
  const messages = [
    { id: 'a0000008-0000-0000-0000-000000000001', engagement_id: 'f0000001-0000-0000-0000-000000000001', sender_id: seller, content: 'Good morning Atty. Santos! I have sent the SPA documents via LBC courier. Tracking number: LBC-2026-123456. Expected delivery is tomorrow.', created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: 'a0000008-0000-0000-0000-000000000002', engagement_id: 'f0000001-0000-0000-0000-000000000001', sender_id: agent, content: 'Good morning! Thank you for the tracking number. I will watch out for the delivery. Once I receive the documents, I will notarize them and send you a scanned copy via email within the same day.', created_at: new Date(Date.now() - 7 * 86400000 + 7200000).toISOString() },
    { id: 'a0000008-0000-0000-0000-000000000003', engagement_id: 'f0000001-0000-0000-0000-000000000001', sender_id: agent, content: 'I have received the documents today. Everything looks good. I will proceed with the notarization this afternoon.', created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
    { id: 'a0000008-0000-0000-0000-000000000004', engagement_id: 'f0000001-0000-0000-0000-000000000001', sender_id: seller, content: 'Thank you so much! Please let me know once it is done. I need the notarized SPA by end of this week.', created_at: new Date(Date.now() - 6 * 86400000 + 3600000).toISOString() },
    { id: 'a0000008-0000-0000-0000-000000000005', engagement_id: 'f0000001-0000-0000-0000-000000000001', sender_id: agent, content: 'Done! I have notarized the SPA and sent the scanned copy to your email. The original documents will be sent back via LBC tomorrow morning. Tracking number will be provided once shipped.', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'a0000008-0000-0000-0000-000000000006', engagement_id: 'f0000001-0000-0000-0000-000000000002', sender_id: buyer, content: 'Hello Atty. Santos, I have uploaded the title copy and the Deed of Sale to the shared folder I sent to your email. Please let me know if you need any other documents.', created_at: new Date(Date.now() - 43 * 86400000).toISOString() },
    { id: 'a0000008-0000-0000-0000-000000000007', engagement_id: 'f0000001-0000-0000-0000-000000000002', sender_id: agent, content: 'Thank you! I have received the documents. The annotation on the title appears to be a mortgage lien from a previous owner. I will prepare a full written opinion by tomorrow.', created_at: new Date(Date.now() - 43 * 86400000 + 10800000).toISOString() },
    { id: 'a0000008-0000-0000-0000-000000000008', engagement_id: 'f0000001-0000-0000-0000-000000000002', sender_id: agent, content: 'I have sent the written legal opinion to your email. In summary: the annotation is a cancelled mortgage from 2018 and poses no risk to the transaction. The title is clean. You may proceed with the purchase.', created_at: new Date(Date.now() - 42 * 86400000).toISOString() },
    { id: 'a0000008-0000-0000-0000-000000000009', engagement_id: 'f0000001-0000-0000-0000-000000000002', sender_id: buyer, content: 'Thank you so much Atty. Santos! This is very reassuring. I will proceed with the purchase. I am marking this engagement as complete.', created_at: new Date(Date.now() - 42 * 86400000 + 7200000).toISOString() },
  ]
  const { error: msgErr } = await supabase.from('engagement_messages').upsert(messages, { onConflict: 'id' })
  if (msgErr) console.error('  ❌ engagement_messages:', msgErr.message)
  else console.log('  ✅ 9 messages inserted')

  console.log('\n✅ Services seed complete!')
  console.log('   4 approved provider profiles (featured: Atty. Santos, Engr. Reyes)')
  console.log('   6 service requests (3 open, 1 in_progress, 1 completed, 1 open)')
  console.log('   5 proposals across 3 requests')
  console.log('   2 engagements (1 active, 1 completed)')
  console.log('   1 rating (5★ for Atty. Santos)')
  console.log('   9 engagement messages')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
