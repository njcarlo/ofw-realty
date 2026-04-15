# LUPA PH Email Templates Setup

## Option A — Use templates as-is (Supabase shared SMTP)

Paste the HTML from each file directly into:
**Supabase Dashboard → Authentication → Email Templates**

- `confirm-signup.html` → Confirm signup template
- `magic-link.html` → Magic link template

If you get "blocked keywords" error, use Option B.

---

## Option B — Custom SMTP with Resend (recommended)

Resend is free (100 emails/day), removes all content restrictions,
and gives you full branding control.

### Step 1: Create Resend account
1. Go to https://resend.com → Sign up free
2. Go to **API Keys** → Create API Key
3. Copy the key (starts with `re_`)

### Step 2: Configure Supabase SMTP
Go to: Supabase → Project Settings → Authentication → SMTP Settings

```
Enable custom SMTP: ON
Host:               smtp.resend.com
Port:               465
Username:           resend
Password:           re_xxxxxxxxxxxx  (your Resend API key)
Sender name:        LUPA PH
Sender email:       noreply@yourdomain.com
```

> If you don't have a custom domain yet, use:
> `noreply@ofw-realty-web.vercel.app`
> (Resend allows sending from Vercel subdomains on free plan)

### Step 3: Add to Railway env vars
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

### Step 4: Paste templates
Once custom SMTP is configured, paste the HTML templates —
no content restrictions apply.

---

## Template Variables (Supabase)

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | The verification/magic link URL |
| `{{ .Email }}` | The user's email address |
| `{{ .Token }}` | The raw token (rarely needed) |
