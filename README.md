# LUPA PH — Philippine Real Estate for OFWs

> **L**ots · **U**nits · **P**roperties **A**nywhere

The Philippines' first OFW-focused real estate marketplace with blockchain-verified agents, interactive hazard maps, and a full SPA workflow for Filipinos abroad.

🌐 **Live:** [ofw-realty-web.vercel.app](https://ofw-realty-web.vercel.app)
👤 **Agent Portal:** [ofw-realty-agent-portal.vercel.app](https://ofw-realty-agent-portal.vercel.app)
🏢 **Broker Portal:** [ofw-realty-broker-portal.vercel.app](https://ofw-realty-broker-portal.vercel.app)

---

## What is LUPA PH?

LUPA PH solves the core problem OFWs face when buying property in the Philippines from abroad:

- **Can't visit** — GPS live site visits with geotagged photos
- **Can't trust agents** — Blockchain-verified PRC licenses
- **Don't know the costs** — Instant closing cost calculator (CGT, DST, transfer tax)
- **SPA is complicated** — Step-by-step guide with embassy locator
- **Currency confusion** — Real-time PHP → USD/AED/SGD/HKD/SAR conversion
- **Hazard risk** — Flood, earthquake, typhoon overlays on every property

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web App | Next.js 14, React 18, TypeScript |
| Agent Portal | Next.js 14 |
| Broker Portal | Next.js 14 |
| API | NestJS 10, TypeScript |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Map | MapLibre GL JS + OpenFreeMap (free tiles) |
| Automation | n8n (Facebook Ads, social posts) |
| Email | Resend (custom SMTP) |
| Monorepo | Turborepo |
| Deployment | Vercel (web/portals) + Railway (API) |

---

## Project Structure

```
ofw-realty/
├── apps/
│   ├── web/                    # Main buyer/seller app (portal.lupa.ph)
│   ├── agent-portal/           # Agent dashboard (agent.lupa.ph)
│   ├── broker-portal/          # Broker dashboard (broker.lupa.ph)
│   ├── admin-portal/           # Admin verification dashboard
│   └── mobile/                 # React Native / Expo (iOS + Android)
├── services/
│   ├── api/                    # NestJS REST API (api.lupa.ph)
│   ├── blockchain/             # Hyperledger Fabric stub
│   └── notifications/          # Push notification service
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── auth/                   # Supabase auth helpers
│   ├── map/                    # MapLibre GL JS wrapper
│   ├── api-client/             # Typed API fetch + Zod schemas
│   └── utils/                  # Currency, financing, geo helpers
├── supabase/
│   ├── migrations/             # 009 SQL migrations
│   ├── email-templates/        # Branded Supabase email templates
│   └── hazard-layers/          # GeoJSON hazard data
├── n8n/                        # Facebook Ads automation workflow
└── docs/                       # Integration guides
```

---

## User Roles

| Role | Where | What they can do |
|------|-------|-----------------|
| **Buyer** | Web app | Browse map, save properties, submit inquiries, SPA workflow |
| **Seller** | Web app (`/sell`) | List properties, request agent representation |
| **Agent** | Agent portal | Manage listings, leads, open houses, commissions, site visits |
| **Broker** | Broker portal | Manage agents, property pool, co-broking, ads |
| **Admin** | Admin portal | Verify agents, review documents, manage platform |

---

## Key Features

### For Buyers (OFWs)
- 🗺️ Interactive Philippines map with property pins
- ⚠️ Disaster risk overlays (flood, earthquake, typhoon, landslide, storm surge)
- 💱 Multi-currency prices (PHP, USD, AED, SGD, HKD, SAR)
- 🧮 Closing cost calculator (CGT, DST, LGU transfer tax, LRA registration)
- 🏦 Financing calculator (Pag-IBIG, bank loan, in-house)
- 📋 SPA workflow with embassy locator
- 📅 Time zone-aware viewing scheduler
- ✈️ Balikbayan Mode — filter by hometown

### For Sellers
- 📝 4-step listing form with photo upload to Supabase Storage
- 🤝 Optional: request verified agent/broker representation
- 📊 Listing analytics (views, inquiries)
- 🔄 Status management (active → reserved → sold)

### For Agents
- 🏠 Listing management with full CRUD
- 💬 Lead management with Messenger CRM integration
- 📍 GPS live site visits with geotagged photos
- 🏛️ Open house scheduling with social announcement
- 💰 Commission tracking
- 📱 Facebook Ads automation via n8n
- 🏆 Gamified performance points
- 📄 Document verification (9 docs → Verified Badge)

### For Brokers
- 👥 Agent roster management
- 📋 Property pool with claim system
- 🤝 Co-broking network with real-time status sync
- 💰 Commission rate configuration
- 📢 Brokerage-wide Facebook Ads with monthly cap
- 🏆 Agent leaderboard with configurable point values

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 10+

### Install & Run

```bash
# Clone the repo
git clone https://github.com/njcarlo/ofw-realty.git
cd ofw-realty

# Install all dependencies
npm install

# Start all 4 apps in parallel
npm run dev
```

| App | URL |
|-----|-----|
| Web (buyer/seller) | http://localhost:3000 |
| API | http://localhost:3001 |
| Agent Portal | http://localhost:3002 |
| Broker Portal | http://localhost:3003 |

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Buyer | buyer@demo.lupaph.com | Demo@12345 |
| Agent | agent@demo.lupaph.com | Demo@12345 |
| Broker | broker@demo.lupaph.com | Demo@12345 |

Or click the **🧪 Demo** button in the navbar.

### If ports are busy

```bash
npm run kill   # kills ports 3000-3003
npm run dev    # start fresh
```

---

## Environment Variables

Copy `.env.example` to `.env` in each app/service directory.

### Web App (`apps/web/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAPLIBRE_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
NEXT_PUBLIC_AGENT_PORTAL_URL=http://localhost:3002
NEXT_PUBLIC_BROKER_PORTAL_URL=http://localhost:3003
```

### API (`services/api/.env`)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3001
APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:3003
RESEND_API_KEY=          # Email (Resend)
N8N_WEBHOOK_URL=         # n8n automation
META_APP_ID=             # Facebook Ads
META_APP_SECRET=
```

---

## Database

9 Supabase migrations in `supabase/migrations/`:

| Migration | Description |
|-----------|-------------|
| 000_setup | Extensions (PostGIS, UUID) |
| 001_core_tables | users, listings, realtors, broker_companies |
| 002_supporting_tables | inquiries, commissions, documents, notifications |
| 003_phase2_tables | ad_campaigns, tokenized_properties, deal_rooms |
| 004_rls_policies | Row Level Security for all tables |
| 005_realtime | Supabase Realtime subscriptions |
| 006_fix_rls_recursion | Fix infinite recursion in users policy |
| 007_ads_columns | Facebook Ads columns |
| 008_facebook_connections | Per-user FB OAuth connections |
| 009_storage_buckets | Supabase Storage buckets |

Run migrations in Supabase SQL editor in order.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

**Quick summary:**
- **Vercel** — deploy `apps/web`, `apps/agent-portal`, `apps/broker-portal` as 3 separate projects
- **Railway** — deploy `services/api` with Root Directory set to `services/api`
- **Supabase** — already hosted, run migrations in SQL editor

---

## Facebook Ads Integration

Each agent/broker connects their own Facebook Ad Account via OAuth. See [docs/FACEBOOK_ADS_SETUP.md](./docs/FACEBOOK_ADS_SETUP.md).

---

## License

Private — all rights reserved. Contact for licensing inquiries.
