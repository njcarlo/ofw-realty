# Social Media Integration Setup — LUPA PH Agent Portal

## Overview

The Social Media page at `/social` allows agents to:
1. **Connect their Facebook account** (OAuth) to run paid ads
2. **Post organic listings** to their Facebook Page and Instagram
3. **Run paid Facebook Ad campaigns** targeting OFWs abroad
4. **Announce Open Houses** with Facebook Live links

---

## Step 1 — Create a Meta App (One-time, Admin only)

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps → Create App → Business**
3. App Name: `LUPA PH`
4. Add products: **Marketing API** + **Facebook Login**
5. Go to **Settings → Basic** → copy:
   - `App ID` → `META_APP_ID`
   - `App Secret` → `META_APP_SECRET`

### Add OAuth Redirect URIs

In your app → **Facebook Login → Settings → Valid OAuth Redirect URIs**:
```
https://ofw-realty-api-production.up.railway.app/ads/oauth/callback
http://localhost:3001/ads/oauth/callback
```

---

## Step 2 — Add env vars to Railway

In Railway → your API service → **Variables**:

```
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
APP_URL=https://ofw-realty-web.vercel.app
```

---

## Step 3 — Agent connects their Facebook account

Once the API has `META_APP_ID` set, agents can:

1. Go to **Agent Portal → Social Media** (`/social`)
2. Click **"Connect Facebook"** button
3. A Facebook login popup appears
4. Agent logs in with their own Facebook account
5. Grants permissions: `ads_management`, `pages_manage_ads`, `pages_read_engagement`
6. Redirected back to the portal — now shows their connected account

### What permissions are requested:
| Permission | Why |
|-----------|-----|
| `ads_management` | Create and manage ad campaigns |
| `ads_read` | Read campaign metrics |
| `pages_manage_ads` | Run ads on behalf of their Page |
| `pages_read_engagement` | Read Page info and posts |
| `business_management` | Access Business Manager |

---

## Step 4 — Select Ad Account & Page

After connecting, the agent clicks **"Change Account"** to:
- Select which **Ad Account** to charge (they may have multiple)
- Select which **Facebook Page** the ads will run from

---

## Step 5 — Run a Campaign

1. Click **"Run Ad"** button
2. Fill in: listing ID, image URL, budget, duration, target countries
3. Click **"Launch"** → campaign goes to Meta for review (24h)
4. Status updates: `Pending Review → Active`

---

## Step 6 — Organic Posts (n8n)

For organic posts (not paid ads), you need n8n configured:

1. Deploy n8n (see `docs/FACEBOOK_ADS_SETUP.md`)
2. Import `n8n/facebook-ads-workflow.json`
3. Set `N8N_WEBHOOK_URL` in Railway env vars

Organic posts are triggered automatically when a listing is published.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Connect Facebook" button missing | `META_APP_ID` not set in Railway |
| OAuth redirect fails | Add redirect URI in Meta App settings |
| "App not approved" error | Add agent as Tester in Meta App → Roles |
| Campaign stuck in Pending Review | n8n not configured or Meta reviewing |
| Token expired warning | Agent clicks "Connect Facebook" again to refresh |

---

## Current Status (Production)

- ✅ Facebook OAuth flow — built, needs `META_APP_ID` in Railway
- ✅ Per-agent FB credentials stored in `facebook_connections` table
- ✅ Campaign creation UI — fully functional
- ✅ Pause/resume/stop campaigns
- ✅ Daily metrics sync (via n8n)
- ⏳ Organic post automation — needs n8n deployed
- ⏳ Open House social announcement — needs n8n + FB Page connected
