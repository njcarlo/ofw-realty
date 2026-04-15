# Facebook Ads Integration Guide — LUPA PH

Each agent and broker connects **their own** Facebook Ad Account. LUPA PH never holds a shared platform-wide FB credential — every campaign runs under the individual's own Meta account.

---

## How It Works

```
Agent/Broker clicks "Connect Facebook"
        ↓
Facebook OAuth (they log in with their own FB account)
        ↓
LUPA PH stores their access_token + ad_account_id + page_id
        ↓
When they create a campaign → their credentials are sent to n8n
        ↓
n8n calls Meta API using their token → campaign created in their Ad Manager
        ↓
Daily cron syncs impressions/clicks back to LUPA PH
```

---

## Part 1 — One-Time Platform Setup (Admin only)

You only do this once. This creates the Meta App that handles the OAuth flow.

### Step 1: Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps → Create App**
3. Select **Business** as the app type
4. Fill in:
   - App Name: `LUPA PH`
   - App Contact Email: your admin email
   - Business Account: your Meta Business account
5. Click **Create App**

### Step 2: Add the Marketing API product

In your app dashboard → **Add Product** → select **Marketing API**

### Step 3: Configure OAuth Redirect URIs

1. In your app → **Facebook Login → Settings**
2. Add to **Valid OAuth Redirect URIs**:
   ```
   https://api.lupa.ph/ads/oauth/callback
   http://localhost:3001/ads/oauth/callback
   ```
3. Save changes

### Step 4: Get App Credentials

Go to **Settings → Basic** and copy:

```
App ID:     → META_APP_ID
App Secret: → META_APP_SECRET
```

### Step 5: Set Required Permissions

In your app → **App Review → Permissions and Features**, request:
- `ads_management` — create/manage campaigns
- `ads_read` — read campaign metrics
- `pages_manage_ads` — run ads on behalf of pages
- `pages_read_engagement` — read page info

> While in **Development Mode**, only users added as Testers/Developers can connect. Submit for App Review before going live.

### Step 6: Add to API environment variables

In `ofw-realty/services/api/.env`:

```env
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
APP_URL=https://api.lupa.ph
```

---

## Part 2 — n8n Setup

### Step 1: Deploy n8n

**Option A — n8n Cloud (recommended)**
1. Sign up at [n8n.io](https://n8n.io)
2. Create a new workspace

**Option B — Self-hosted on Railway**
```bash
railway new  # select n8n template
```

### Step 2: Import the Workflow

1. In n8n → **Workflows → Import from File**
2. Upload `ofw-realty/n8n/facebook-ads-workflow.json`
3. Activate the workflow

### Step 3: Set n8n Environment Variables

```
APP_URL          = https://portal.lupa.ph
LUPAPH_API_URL   = https://api.lupa.ph
LUPAPH_API_KEY   = (random secret — add same value to API .env as N8N_API_KEY)
```

> Note: The workflow no longer uses `META_ACCESS_TOKEN` or `META_AD_ACCOUNT_ID` as global vars — those come per-campaign from the LUPA PH API (each user's own token).

### Step 4: Copy the Webhook URL

1. Click the **Webhook: Create Campaign** node
2. Copy the **Production URL**:
   `https://your-n8n.app.n8n.cloud/webhook/facebook-ads-create`
3. Add to API .env as `N8N_WEBHOOK_URL`

### Step 5: Add to API environment variables

```env
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook
N8N_API_KEY=your-random-secret
```

---

## Part 3 — Database Migration

Run in Supabase SQL editor:

```sql
-- From ofw-realty/supabase/migrations/007_ads_columns.sql
ALTER TABLE ad_campaigns
  ADD COLUMN IF NOT EXISTS caption          text,
  ADD COLUMN IF NOT EXISTS image_url        text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS duration_days    integer DEFAULT 7;

-- From ofw-realty/supabase/migrations/008_facebook_connections.sql
CREATE TABLE facebook_connections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fb_user_id          text NOT NULL,
  fb_user_name        text,
  fb_page_id          text,
  fb_page_name        text,
  fb_ad_account_id    text,
  fb_ad_account_name  text,
  access_token        text NOT NULL,
  token_expires_at    timestamptz,
  scopes              text[],
  connected_at        timestamptz DEFAULT now(),
  disconnected_at     timestamptz,
  is_active           boolean DEFAULT true,
  UNIQUE(user_id)
);

ALTER TABLE facebook_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_fb_connection" ON facebook_connections
  FOR ALL USING (auth.uid() = user_id);
```

---

## Part 4 — Agent/Broker Flow (End User)

This is what each agent or broker does in their portal:

### Step 1: Connect Facebook

1. Go to **Social Media** (agent) or **Ad Campaigns** (broker)
2. Click **Connect Facebook**
3. A Facebook login popup appears — log in with their own FB account
4. Grant the requested permissions (ads_management, pages_manage_ads, etc.)
5. They're redirected back to the portal — now showing their connected account name

### Step 2: Select Ad Account & Page

After connecting, click **Change Account** to:
- Select which **Ad Account** to charge (they may have multiple)
- Select which **Facebook Page** the ads will run from

### Step 3: Create a Campaign

1. Click **New Campaign** / **Run Ad**
2. Fill in:
   - Listing (paste the listing UUID)
   - Ad image URL
   - Budget (PHP) and duration (7/14/30 days)
   - Target countries (OFW markets pre-selected)
   - Caption (auto-generated from listing if left blank)
3. Click **Launch Campaign**
4. Campaign goes to Meta for review (usually 24h)
5. Status updates automatically: `Pending Review → Active`

### Step 4: Monitor

- Impressions, reach, clicks sync daily from Meta
- Pause/resume/stop from the portal
- Monthly spend cap (₱100k default) prevents overspending

---

## Part 5 — Token Expiry

Facebook long-lived tokens last **60 days**. The portal shows a warning when a token is expiring within 14 days.

To reconnect, the agent/broker just clicks **Connect Facebook** again — it refreshes the token automatically.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "Facebook account not connected" | User hasn't done OAuth | Click "Connect Facebook" |
| "No Ad Account selected" | Connected but no account picked | Click "Change Account" |
| `Invalid OAuth access token` | Token expired | Reconnect Facebook |
| Campaign stuck in `pending_review` | n8n not configured | Set `N8N_WEBHOOK_URL` |
| `App not approved` | Meta app in dev mode | Add user as Tester in Meta App dashboard |
| `Special ad category required` | Real estate in US/EU | Add `HOUSING` to special_ad_categories in n8n workflow |

---

## Security Notes

- Access tokens are stored in the `facebook_connections` table
- For production, encrypt tokens using `FIELD_ENCRYPTION_KEY` before storing
- Tokens are never exposed to the frontend — only used server-side in the API
- Each user can only see/manage their own connection (RLS enforced)
- Disconnecting revokes the token from Meta immediately
