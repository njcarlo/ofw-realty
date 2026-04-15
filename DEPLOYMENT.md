# LUPA PH Deployment Guide

## Subdomain Architecture

| Subdomain | App | Local Port |
|-----------|-----|-----------|
| `portal.lupa.ph` | Main buyer app | 3000 |
| `agent.lupa.ph` | Agent portal | 3002 |
| `broker.lupa.ph` | Broker portal | 3003 |
| `api.lupa.ph` | NestJS API | 3001 |

---

## Recommended Hosting Stack

This is the recommended production setup — all services have free tiers to get started.

| Service | What it hosts | Cost | Why |
|---------|--------------|------|-----|
| **Vercel** | portal, agent, broker (Next.js) | Free → $20/mo | Best Next.js hosting, global CDN, auto-deploys |
| **Railway** | NestJS API | $5/mo | Simple Node.js hosting, custom domains, env vars UI |
| **Supabase** | PostgreSQL + Auth + Storage | Free → $25/mo | Already set up, PostGIS included |
| **n8n Cloud** | Automation workflows | $20/mo | Managed n8n, no server to maintain |
| **Cloudflare** | DNS + CDN | Free | Best DNS for Philippines traffic, DDoS protection |

**Total starting cost: ~$25–45/mo** for a production-ready setup.

---

## Local Development

### Start everything with one command

```bash
cd ofw-realty
npm run dev
```

This starts all 4 apps in parallel:
- `http://localhost:3000` — Main buyer app
- `http://localhost:3001` — API
- `http://localhost:3002` — Agent portal
- `http://localhost:3003` — Broker portal

If you get `EADDRINUSE` errors, run:
```bash
npm run kill   # kills ports 3000-3003
npm run dev    # start fresh
```

### Local subdomain simulation (optional)

Run `scripts/setup-hosts.ps1` as Administrator to access via:
- `http://portal.lupa.ph:3000`
- `http://agent.lupa.ph:3002`
- `http://broker.lupa.ph:3003`

---

## Production Deployment

### Step 1 — Push to GitHub

```bash
cd ofw-realty
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/lupaph.git
git push -u origin main
```

### Step 2 — Deploy to Vercel (3 projects)

Go to [vercel.com/new](https://vercel.com/new) and import your repo **3 times**:

| Project Name | Root Directory | Custom Domain |
|-------------|---------------|---------------|
| `lupaph-portal` | `ofw-realty/apps/web` | `portal.lupa.ph` |
| `lupaph-agent` | `ofw-realty/apps/agent-portal` | `agent.lupa.ph` |
| `lupaph-broker` | `ofw-realty/apps/broker-portal` | `broker.lupa.ph` |

For each project, set these **Environment Variables** in Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL        = https://eewdelfbvkdgbiovsbvr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGci...
NEXT_PUBLIC_API_URL             = https://api.lupa.ph
NEXT_PUBLIC_MAPLIBRE_STYLE_URL  = https://tiles.openfreemap.org/styles/liberty
```

For `lupaph-portal` only, also add:
```
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
```

### Step 3 — Deploy API to Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo → set **Root Directory** to `ofw-realty/services/api`
3. Railway auto-detects Node.js
4. Add Environment Variables (copy from `ofw-realty/services/api/.env`):

```
NEXT_PUBLIC_SUPABASE_URL      = https://eewdelfbvkdgbiovsbvr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY     = eyJhbGci...
APP_URL                       = https://portal.lupa.ph
PORT                          = 3001
ALLOWED_ORIGINS               = https://portal.lupa.ph,https://agent.lupa.ph,https://broker.lupa.ph
NODE_ENV                      = production
N8N_WEBHOOK_URL               = https://your-n8n.app.n8n.cloud/webhook
N8N_API_KEY                   = your-secret-key
META_AD_ACCOUNT_ID            = XXXXXXXXX
META_PAGE_ID                  = XXXXXXXXX
META_ACCESS_TOKEN             = EAAxxxxxxx
```

5. In Railway → Settings → Domains → add `api.lupa.ph`

### Step 4 — DNS Setup (Cloudflare)

Add these DNS records in Cloudflare for `lupa.ph`:

```
Type    Name      Value                        Proxy
CNAME   portal    cname.vercel-dns.com         ✅ Proxied
CNAME   agent     cname.vercel-dns.com         ✅ Proxied
CNAME   broker    cname.vercel-dns.com         ✅ Proxied
CNAME   api       your-app.railway.app         ✅ Proxied
A       @         76.76.21.21                  ✅ Proxied
CNAME   www       portal.lupa.ph               ✅ Proxied
```

> Vercel will give you the exact CNAME value when you add the custom domain in project settings.

### Step 5 — Deploy n8n (for Facebook Ads)

See `docs/FACEBOOK_ADS_SETUP.md` for the full n8n setup guide.

**Quick option — n8n Cloud:**
1. Sign up at [n8n.io](https://n8n.io)
2. Import `ofw-realty/n8n/facebook-ads-workflow.json`
3. Copy the webhook URL → add to Railway env vars as `N8N_WEBHOOK_URL`

---

## Alternative Hosting Options

### Budget Option (~$0–10/mo)

| Service | What |
|---------|------|
| Vercel Free | All 3 Next.js apps |
| Railway Starter ($5) | NestJS API |
| Supabase Free | Database |
| n8n self-hosted on Railway | Automation |

### Scale Option (~$100+/mo)

| Service | What |
|---------|------|
| Vercel Pro ($20) | All 3 Next.js apps + analytics |
| Railway Pro ($20) | API with more resources |
| Supabase Pro ($25) | More DB storage + backups |
| n8n Cloud ($20) | Managed automation |
| Cloudflare Pro ($20) | WAF + advanced DDoS |

### Philippines-Optimized Option

For lowest latency to Philippine users:

| Service | What |
|---------|------|
| Vercel (sin1 region) | Already configured — Singapore edge |
| Railway (Singapore) | Select Singapore region |
| Supabase (Southeast Asia) | Already on Singapore |

All Vercel configs already have `"regions": ["sin1"]` (Singapore) set.

---

## Acquisition Extraction

When a module is acquired, extract the relevant app:

| Acquired | Extract | Keep |
|----------|---------|------|
| Agent Portal | `apps/agent-portal` | Auth, API |
| Broker Portal | `apps/broker-portal` | Auth, API |
| Full Platform | Entire monorepo | — |

Each app is independently deployable — no refactoring needed.

---

## Related Docs

- `docs/FACEBOOK_ADS_SETUP.md` — Full Facebook Ads integration guide
- `n8n/facebook-ads-workflow.json` — Import into n8n
- `supabase/migrations/` — All DB migrations
