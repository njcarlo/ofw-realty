'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const EVENT_TYPES = [
  { key: 'new_connection_request', label: 'New Connection Request', description: 'When a broker sends you a connection request', icon: '🤝' },
  { key: 'reservation_submitted', label: 'Reservation Submitted', description: 'When a broker submits a reservation request for a unit', icon: '📋' },
  { key: 'reservation_expired', label: 'Reservation Auto-Expired', description: 'When a reservation expires without your response', icon: '⏰' },
  { key: 'account_review_outcome', label: 'Account Review Outcome', description: 'When an admin approves or rejects your account', icon: '🔐' },
  { key: 'connection_terminated', label: 'Connection Terminated', description: 'When a broker terminates their connection with you', icon: '🚫' },
]

type DeliveryPref = 'both' | 'in_app' | 'email'

export default function NotificationsPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<Record<string, DeliveryPref>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      const res = await fetch(`${API}/api/developers/me/notification-prefs`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const d = await res.json()
        setPrefs(d)
      } else {
        // Default all to 'both'
        const defaults: Record<string, DeliveryPref> = {}
        EVENT_TYPES.forEach(e => { defaults[e.key] = 'both' })
        setPrefs(defaults)
      }
      setLoading(false)
    })
  }, [router])

  async function handleSave() {
    if (!token) return
    setSaving(true)
    try {
      await fetch(`${API}/api/developers/me/notification-prefs`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const DELIVERY_OPTIONS: { value: DeliveryPref; label: string; icon: string }[] = [
    { value: 'both', label: 'In-App & Email', icon: '🔔' },
    { value: 'in_app', label: 'In-App Only', icon: '📱' },
    { value: 'email', label: 'Email Only', icon: '📧' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Notification Preferences</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Configure how you receive notifications for each event type</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {saved && <span style={{ fontSize: 13, color: '#10B981' }}>✓ Saved</span>}
            <button
              onClick={handleSave} disabled={saving}
              style={{ background: saving ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}
            >
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            {/* Legend */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 24 }}>
              {DELIVERY_OPTIONS.map(o => (
                <div key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{o.icon}</span>
                  <span style={{ fontSize: 13, color: '#595959' }}>{o.label}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
              {EVENT_TYPES.map((event, i) => (
                <div key={event.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderBottom: i < EVENT_TYPES.length - 1 ? '1px solid #141414' : 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(112,59,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {event.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{event.label}</div>
                    <div style={{ fontSize: 13, color: '#595959' }}>{event.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {DELIVERY_OPTIONS.map(opt => {
                      const active = (prefs[event.key] ?? 'both') === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setPrefs(p => ({ ...p, [event.key]: opt.value }))}
                          style={{
                            background: active ? 'rgba(112,59,247,0.15)' : '#141414',
                            color: active ? '#703BF7' : '#595959',
                            border: `1px solid ${active ? 'rgba(112,59,247,0.3)' : '#1A1A1A'}`,
                            borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                          title={opt.label}
                        >
                          <span>{opt.icon}</span>
                          <span style={{ display: 'none' }}>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959', minWidth: 120, textAlign: 'right' }}>
                    {DELIVERY_OPTIONS.find(o => o.value === (prefs[event.key] ?? 'both'))?.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(112,59,247,0.05)', border: '1px solid rgba(112,59,247,0.1)', borderRadius: 10, padding: '14px 18px', marginTop: 16 }}>
              <p style={{ fontSize: 13, color: '#595959', margin: 0 }}>
                💡 Notification delivery is handled by the platform's Notification Service. Email notifications are sent to your registered email address.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
