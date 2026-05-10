/**
 * Seed B2B demo profiles + posts + reactions + comments.
 * Requires migration 016_b2b_network.sql to be applied first.
 * Run: node scripts/seed-b2b-posts.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '../services/api/.env'), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function main() {
  console.log('🌱 Seeding B2B Network demo data...\n')

  // ── Check tables exist ────────────────────────────────────────────────────
  const { error: tableCheck } = await sb.from('b2b_profiles').select('id').limit(1)
  if (tableCheck) {
    console.error('❌ b2b_profiles table not found:', tableCheck.message)
    console.error('\nPlease run supabase/migrations/016_b2b_network.sql in the Supabase SQL Editor first.')
    process.exit(1)
  }

  // ── Get demo users ────────────────────────────────────────────────────────
  const { data: users } = await sb.from('users')
    .select('id, email, full_name, role')
    .in('email', ['broker@demo.lupaph.com', 'agent@demo.lupaph.com', 'buyer@demo.lupaph.com', 'seller@demo.lupaph.com'])

  if (!users || users.length === 0) {
    console.error('❌ No demo users found. Make sure demo accounts exist in Supabase Auth.')
    process.exit(1)
  }
  console.log(`Found ${users.length} demo user(s):`, users.map(u => u.email).join(', '))

  // ── Create b2b_profiles for demo users ───────────────────────────────────
  console.log('\n📋 Creating B2B profiles...')

  const profileData = [
    {
      email: 'broker@demo.lupaph.com',
      display_name: 'Ana Broker Cruz',
      headline: 'Licensed Real Estate Broker · LupaPH Realty · Cavite & Metro Manila Specialist',
      bio: 'Experienced real estate broker with 8 years in the industry. Specializing in OFW clients and residential properties in Cavite and Metro Manila. PRC Licensed Broker.',
      location: 'Bacoor, Cavite',
      years_experience: 8,
      specializations: ['Residential', 'OFW Clients', 'Condominiums', 'Pre-Selling'],
      languages: ['Filipino', 'English'],
      prc_license_number: 'PRC-BROKER-2024-001',
      prc_license_type: 'broker',
      prc_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
      connection_count: 47,
      listing_count: 12,
      post_count: 8,
    },
    {
      email: 'agent@demo.lupaph.com',
      display_name: 'Juan Agent Santos',
      headline: 'Real Estate Salesperson · LupaPH Realty · Cavite Specialist',
      bio: 'Dedicated real estate agent helping OFW families find their dream homes in Cavite. 5 years experience, 50+ closed deals.',
      location: 'Dasmariñas, Cavite',
      years_experience: 5,
      specializations: ['Residential', 'OFW Clients', 'Farm Lots'],
      languages: ['Filipino', 'English'],
      prc_license_number: 'PRC-SALES-2024-002',
      prc_license_type: 'salesperson',
      prc_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80',
      connection_count: 23,
      listing_count: 8,
      post_count: 5,
    },
    {
      email: 'buyer@demo.lupaph.com',
      display_name: 'Maria OFW Buyer',
      headline: 'Property Investor · OFW · Dubai-based',
      bio: 'OFW based in Dubai looking to invest in Philippine real estate. Interested in house & lot and residential lots in Cavite and Laguna.',
      location: 'Dubai, UAE (from Cavite)',
      years_experience: 2,
      specializations: ['OFW Clients', 'Residential'],
      languages: ['Filipino', 'English', 'Arabic'],
      prc_verified: false,
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
      connection_count: 12,
      listing_count: 0,
      post_count: 2,
    },
    {
      email: 'seller@demo.lupaph.com',
      display_name: 'Pedro Seller Reyes',
      headline: 'Property Owner · Selling House & Lot in Cavite',
      bio: 'Selling my property in Bacoor, Cavite. Looking for a reliable broker to help with the transaction.',
      location: 'Bacoor, Cavite',
      years_experience: 1,
      specializations: ['Residential'],
      languages: ['Filipino', 'English'],
      prc_verified: false,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      connection_count: 5,
      listing_count: 1,
      post_count: 1,
    },
  ]

  const profiles = []
  for (const pd of profileData) {
    const user = users.find(u => u.email === pd.email)
    if (!user) continue

    const { email, ...profileFields } = pd
    const { data: existing } = await sb.from('b2b_profiles').select('id').eq('user_id', user.id).maybeSingle()

    if (existing) {
      console.log(`  ⏭  Profile already exists for ${pd.display_name}`)
      profiles.push({ ...existing, ...profileFields, id: existing.id })
      continue
    }

    const { data: prof, error } = await sb.from('b2b_profiles').insert({
      user_id: user.id,
      ...profileFields,
      is_active: true,
    }).select('id').single()

    if (error) { console.error(`  ❌ ${pd.display_name}:`, error.message); continue }
    console.log(`  ✅ Created profile: ${pd.display_name}`)
    profiles.push({ id: prof.id, ...profileFields })
  }

  if (profiles.length === 0) { console.error('No profiles created.'); process.exit(1) }

  // ── Seed connections between profiles ────────────────────────────────────
  console.log('\n📋 Seeding connections...')
  const connPairs = [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 3],
  ]
  for (const [a, b] of connPairs) {
    if (!profiles[a] || !profiles[b]) continue
    await sb.from('b2b_connections').upsert({
      requester_id: profiles[a].id,
      addressee_id: profiles[b].id,
      status: 'accepted',
    }, { onConflict: 'requester_id,addressee_id' })
  }
  console.log(`  ✅ ${connPairs.length} connections seeded`)

  // ── Get listings ──────────────────────────────────────────────────────────
  const { data: listings } = await sb.from('listings')
    .select('id, title, price_php, city, province, property_type, lot_area_sqm, listing_photos(url, is_primary)')
    .eq('status', 'active').limit(10)
  const L = listings ?? []
  console.log(`\nFound ${L.length} listings to attach to posts`)

  // ── Post templates ────────────────────────────────────────────────────────
  const now = Date.now()
  const ago = (h) => new Date(now - h * 3600000).toISOString()

  const posts = [
    {
      author: 0, post_type: 'listing_share', listing: 0, co_broke: true, split: 50,
      created_at: ago(1),
      content: `🏠 BAGONG LISTING — House & Lot sa Bacoor, Cavite!\n\nReady for occupancy, 2 bedrooms, malapit sa Aguinaldo Highway at mga schools. Perfect para sa OFW families na gusto ng malapit sa Metro Manila.\n\n✅ Clean title\n✅ Blockchain verified\n✅ Flexible payment terms\n\nOpen for co-broking — 50/50 split! DM ako para sa floor plan at full details. 🤝\n\n#LupaPH #Cavite #HouseAndLot #OFWInvestment #CoBroking`,
    },
    {
      author: 1, post_type: 'listing_share', listing: 2, co_broke: true, split: 50,
      created_at: ago(3),
      content: `🌿 Residential Lot sa Sta. Rosa, Laguna — 200 sqm!\n\nPrime location malapit sa Nuvali at SLEX. Malaking appreciation potential ang area na ito. Ideal para sa OFW na gustong mag-build ng dream home.\n\n✅ 200 sqm\n✅ Clean title, blockchain verified\n✅ Near Nuvali, schools, malls\n\nOpen for co-broking! Mag-message kayo. 📩\n\n#Laguna #StaRosa #ResidentialLot #OFW`,
    },
    {
      author: 0, post_type: 'market_insight', listing: null,
      created_at: ago(5),
      content: `📊 MARKET UPDATE — Q2 2026\n\nNapansin ko ang mga trend na ito sa aming area:\n\n🔥 Tumataas ang demand sa Cavite at Laguna\n📈 Prices up 8–12% vs last year\n👥 Maraming OFW buyers mula Middle East\n💰 Budget range: ₱1.5M–₱3.5M ang pinaka-active\n\nKung mayroon kayong listings sa Cavite, Laguna, o Batangas — ngayon ang tamang oras para i-share sa network!\n\nAny questions? Comment below! 👇\n\n#MarketUpdate #RealEstate #Philippines #OFW #LupaPH`,
    },
    {
      author: 1, post_type: 'co_broking_request', listing: null,
      created_at: ago(8),
      content: `🤝 CO-BROKING REQUEST — May Buyer Ako!\n\nNaghahanap ng property para sa aking OFW client:\n\n📍 Location: Cavite o Laguna\n🏠 Type: House & Lot o Residential Lot\n💰 Budget: ₱2M–₱4M\n📅 Timeline: Ready to buy within 60 days\n✈️ Based sa: Saudi Arabia\n🏦 Financing: Pag-IBIG approved\n\nKung mayroon kayong matching listings, mag-connect tayo! Fair split ang commission. Serious buyer ito — may pre-approval na.\n\nDM ako ASAP! 📩\n\n#CoBroking #BuyerLooking #Cavite #Laguna #OFW`,
    },
    {
      author: 0, post_type: 'listing_share', listing: 1, co_broke: true, split: 40,
      created_at: ago(12),
      content: `🏙️ Condo Unit sa Cebu IT Park — Fully Furnished!\n\nHigh-rise condo sa puso ng Cebu business district. Ideal para sa investment o OFW family use. High rental yield potential!\n\n✅ Fully furnished\n✅ Gym, pool, 24/7 security\n✅ Blockchain verified title\n✅ Near IT companies, malls, hospitals\n\nOpen for co-broking — 60/40 split. Mag-message kayo para sa full details at payment terms! 💬\n\n#Cebu #Condo #Investment #OFW #CoBroking`,
    },
    {
      author: 1, post_type: 'update', listing: null,
      created_at: ago(18),
      content: `🎉 CLOSED DEAL ALERT!\n\nNaka-close na kami ng House & Lot sa Davao City — ₱7.5M! OFW buyer mula Saudi Arabia.\n\nSalamat sa aming co-broker na tumulong sa buyer side. Ganito ang kapangyarihan ng B2B networking! 💪\n\nMga natutuhan ko sa deal na ito:\n✅ Trust ang pinaka-importante sa OFW clients\n✅ Regular updates = happy buyers\n✅ Co-broking = mas maraming deals\n\nKung gusto ninyong mag-partner sa future deals, open tayo! DM lang. 🤝\n\n#ClosedDeal #Davao #CoBroking #LupaPH #Teamwork`,
    },
    {
      author: 0, post_type: 'listing_share', listing: 3, co_broke: false, split: null,
      created_at: ago(24),
      content: `🌾 Farm Lot sa Lipa, Batangas — 1,000 sqm!\n\nAgricultural lot na may mountain view. Perfect para sa agri-tourism, retirement home, o weekend getaway. Cool climate, scenic views ng Mt. Malarayat.\n\n✅ 1,000 sqm\n✅ Agricultural classification\n✅ Near hot spring resorts\n✅ Accessible via STAR Tollway\n\nIdeal para sa OFW na gustong mag-invest sa probinsya. Mag-message kayo para sa more details! 📩\n\n#Batangas #FarmLot #Investment #Retirement #OFW`,
    },
    {
      author: 1, post_type: 'market_insight', listing: null,
      created_at: ago(30),
      content: `💡 TIPS PARA SA MGA BAGONG BROKER:\n\nAng pinaka-epektibong paraan para makapag-close ng deal:\n\n1️⃣ Mag-specialize sa isang area — maging expert\n2️⃣ Mag-build ng network — co-broking is key!\n3️⃣ Mag-focus sa OFW market — serious buyers\n4️⃣ I-verify ang PRC license — builds trust agad\n5️⃣ Mag-post ng regular updates sa network\n6️⃣ Maging responsive — reply within 1 hour\n7️⃣ Mag-invest sa professional photos ng listings\n\nAny questions? Comment below! Tutulong ako. 👇\n\n#BrokerTips #RealEstate #Philippines #Beginners`,
    },
    {
      author: 0, post_type: 'service_offer', listing: null,
      created_at: ago(36),
      content: `🛠️ SERBISYO: Title Transfer para sa OFW Clients\n\nNag-o-offer kami ng end-to-end title transfer service:\n\n✅ BIR clearance (CGT, DST)\n✅ Registry of Deeds processing\n✅ Liaison sa Cavite, Laguna, Metro Manila\n✅ Regular updates via Viber/WhatsApp\n✅ Kaya gawin kahit nasa abroad kayo\n✅ Trusted network ng lawyers at liaisons\n\n💰 Fee: ₱15,000–₱25,000\n⏱️ Timeline: 3–4 weeks\n📋 Government fees: separate\n\nInterested? DM ako! 📩\n\n#TitleTransfer #OFW #RealEstateServices #LupaPH`,
    },
    {
      author: 2, post_type: 'update', listing: null,
      created_at: ago(48),
      content: `Naghahanap po ako ng magandang property sa Cavite o Laguna. OFW po ako sa Dubai, gusto ko mag-invest para sa pamilya ko.\n\nBudget: ₱2M–₱3.5M\nType: House & Lot o Lot\nTimeline: 3–6 months\n\nKung may alam kayong magandang listing, please DM po! Salamat 🙏\n\n#PropertyHunting #OFW #Cavite #Laguna`,
    },
  ]

  // ── Insert posts ──────────────────────────────────────────────────────────
  console.log('\n📋 Inserting posts...')
  const insertedPosts = []

  for (const p of posts) {
    const author = profiles[p.author]
    if (!author) continue
    const listing = p.listing !== null ? L[p.listing] : null

    const { data: post, error } = await sb.from('b2b_posts').insert({
      author_id: author.id,
      content: p.content,
      post_type: p.post_type,
      listing_id: listing?.id ?? null,
      visibility: 'public',
      reaction_count: Math.floor(Math.random() * 28) + 2,
      comment_count: Math.floor(Math.random() * 6) + 1,
      share_count: Math.floor(Math.random() * 4),
      created_at: p.created_at,
      updated_at: p.created_at,
    }).select('id').single()

    if (error) { console.error(`  ❌ Post error:`, error.message); continue }
    insertedPosts.push(post)

    // Listing share record
    if (listing && p.post_type === 'listing_share') {
      await sb.from('b2b_listing_shares').upsert({
        profile_id: author.id,
        listing_id: listing.id,
        co_broke: p.co_broke ?? false,
        commission_split: p.split ?? null,
        note: 'Shared via B2B Network',
        created_at: p.created_at,
      }, { onConflict: 'profile_id,listing_id' })
    }

    console.log(`  ✅ [${p.post_type}] ${p.content.slice(0, 55).replace(/\n/g,' ')}…`)
  }

  // ── Reactions ─────────────────────────────────────────────────────────────
  console.log('\n📋 Seeding reactions...')
  const rxTypes = ['like', 'insightful', 'celebrate', 'support']
  let rxCount = 0
  for (const post of insertedPosts) {
    for (const prof of profiles.slice(0, 3)) {
      const { error } = await sb.from('b2b_post_reactions').upsert({
        post_id: post.id,
        profile_id: prof.id,
        reaction: rxTypes[Math.floor(Math.random() * rxTypes.length)],
      }, { onConflict: 'post_id,profile_id' })
      if (!error) rxCount++
    }
  }
  console.log(`  ✅ ${rxCount} reactions`)

  // ── Comments ──────────────────────────────────────────────────────────────
  console.log('\n📋 Seeding comments...')
  const commentBank = [
    'Interested po! Pwede ba mag-request ng floor plan? 🙏',
    'Magkano ang monthly amortization kung mag-Pag-IBIG?',
    'May available pa ba? Buyer ko ay OFW sa Qatar.',
    'Open for co-broking? May buyer ako na interested! 🤝',
    'Salamat sa update! Very helpful para sa aming mga buyers.',
    'Pwede bang mag-schedule ng site visit this weekend?',
    'Ano ang minimum down payment? Flexible ba ang developer?',
    'Congrats sa deal! Ganyan talaga ang teamwork. 💪',
    'Maganda ang location! Malapit ba sa expressway?',
    'Pwede bang makita ang vicinity map? Thank you po!',
    'Naka-Pag-IBIG ba ito? Gusto ng buyer ko ng Pag-IBIG financing.',
    'Saan po pwede makita ang full listing details?',
  ]
  let cmtCount = 0
  for (const post of insertedPosts.slice(0, 8)) {
    const numComments = Math.floor(Math.random() * 3) + 1
    for (let c = 0; c < numComments; c++) {
      const commenter = profiles[Math.floor(Math.random() * profiles.length)]
      const { error } = await sb.from('b2b_comments').insert({
        post_id: post.id,
        author_id: commenter.id,
        content: commentBank[Math.floor(Math.random() * commentBank.length)],
        created_at: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
      })
      if (!error) cmtCount++
    }
  }
  console.log(`  ✅ ${cmtCount} comments`)

  console.log(`\n✅ B2B seed complete!`)
  console.log(`   ${profiles.length} profiles`)
  console.log(`   ${insertedPosts.length} posts`)
  console.log(`   ${rxCount} reactions`)
  console.log(`   ${cmtCount} comments`)
  console.log('\n👉 Head to http://localhost:3008/feed')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
