const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const DEMO_FEATURED = [
  { id: 'p1', full_name: 'Atty. Maria Santos', service_types: ['Notarization', 'Legal Consultation'], avg_rating: 4.9, completed_engagements: 87, is_featured: true },
  { id: 'p2', full_name: 'Engr. Jose Reyes', service_types: ['Geodetic Survey'], avg_rating: 4.8, completed_engagements: 64, is_featured: true },
  { id: 'p3', full_name: 'Maria Cruz, MAE', service_types: ['Property Appraisal'], avg_rating: 4.7, completed_engagements: 52, is_featured: true },
]

const DEMO_REQUESTS = [
  { id: 'r1', service_type: 'Property Appraisal', province: 'Cavite', city: 'Bacoor', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'r2', service_type: 'Title Transfer', province: 'Metro Manila', city: 'Quezon City', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'r3', service_type: 'Geodetic Survey', province: 'Laguna', city: 'Sta. Rosa', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'r4', service_type: 'Notarization', province: 'Metro Manila', city: 'Makati', created_at: new Date(Date.now() - 86400000).toISOString() },
]

const SERVICE_TYPE_LABELS: Record<string, string> = {
  property_appraisal:         'Property Appraisal',
  geodetic_survey:            'Geodetic Survey',
  title_transfer:             'Title Transfer',
  notarization:               'Notarization',
  legal_consultation:         'Legal Consultation',
  property_tax_assistance:    'Property Tax Assistance',
  building_permit_processing: 'Building Permit Processing',
  other:                      'Other',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

async function getFeaturedProviders() {
  try {
    const res = await fetch(`${API}/service-providers?limit=3`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data.length) return { providers: data.slice(0, 3), isDemo: false }
    }
  } catch {}
  return { providers: DEMO_FEATURED, isDemo: true }
}

async function getRecentRequests() {
  try {
    const res = await fetch(`${API}/service-requests?status=open&limit=4`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data.length) return data.slice(0, 4)
    }
  } catch {}
  return DEMO_REQUESTS
}

export default async function ServicesPortalHome() {
  const [{ providers, isDemo }, recentRequests] = await Promise.all([
    getFeaturedProviders(),
    getRecentRequests(),
  ])

  return (
    <div style={{ padding: 32, fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>
          Real Estate Services,<br />
          <span style={{ color: '#703BF7' }}>On Demand</span>
        </h1>
        <p style={{ fontSize: 15, color: '#595959', margin: '12px 0 24px', maxWidth: 520 }}>
          Connect with licensed appraisers, geodetic engineers, notaries, and other real estate professionals across the Philippines.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/requests/new" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 0 20px rgba(112,59,247,0.3)', textDecoration: 'none' }}>
            Post a Request
          </a>
          <a href="/providers" style={{ background: '#0D0D0D', color: '#999', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: '1px solid #1A1A1A', textDecoration: 'none' }}>
            Browse Providers
          </a>
        </div>
      </div>

      {isDemo && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 24, fontSize: 13, color: '#F59E0B' }}>
          ⚠️ Showing sample data — API not yet connected.
        </div>
      )}

      {/* Featured Providers */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>⭐ Featured Providers</h2>
          <a href="/providers" style={{ fontSize: 13, color: '#703BF7', textDecoration: 'none' }}>View all →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {providers.map((provider: any, i: number) => (
            <a
              key={provider.id ?? i}
              href={`/providers/${provider.id}`}
              style={{ display: 'block', background: '#0D0D0D', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '20px 22px', position: 'relative', textDecoration: 'none', color: 'inherit' }}
            >
              <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Featured
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  👤
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{provider.full_name}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>
                    {Array.isArray(provider.service_types)
                      ? provider.service_types.map((t: string) => SERVICE_TYPE_LABELS[t] ?? t).join(' · ')
                      : provider.service_types}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>
                  {provider.avg_rating ? `★ ${Number(provider.avg_rating).toFixed(1)}` : 'No ratings yet'}
                </span>
                <span style={{ fontSize: 12, color: '#595959' }}>{provider.completed_engagements} completed</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Recent Requests */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>📋 Recent Requests</h2>
          <a href="/requests" style={{ fontSize: 13, color: '#703BF7', textDecoration: 'none' }}>View all →</a>
        </div>
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          {recentRequests.map((req: any, i: number) => (
            <a
              key={req.id ?? i}
              href={`/requests/${req.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < recentRequests.length - 1 ? '1px solid #141414' : 'none', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(112,59,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                📋
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                  {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>{req.city}, {req.province}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                  Open
                </span>
                <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>{timeAgo(req.created_at)}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
