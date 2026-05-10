// Services Portal — Landing page with featured providers and recent requests

const FEATURED_PROVIDERS = [
  { name: 'Atty. Maria Santos', type: 'Notarization · Legal Consultation', rating: 4.9, engagements: 87, featured: true },
  { name: 'Engr. Jose Reyes', type: 'Geodetic Survey', rating: 4.8, engagements: 64, featured: true },
  { name: 'Maria Cruz, MAE', type: 'Property Appraisal', rating: 4.7, engagements: 52, featured: true },
]

const RECENT_REQUESTS = [
  { id: '1', type: 'Property Appraisal', location: 'Bacoor, Cavite', posted: '2h ago', status: 'Open' },
  { id: '2', type: 'Title Transfer', location: 'Quezon City, Metro Manila', posted: '5h ago', status: 'Open' },
  { id: '3', type: 'Geodetic Survey', location: 'Sta. Rosa, Laguna', posted: '1d ago', status: 'Open' },
  { id: '4', type: 'Notarization', location: 'Makati, Metro Manila', posted: '1d ago', status: 'Open' },
]

export default function ServicesPortalHome() {
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
          <a
            href="/requests/new"
            style={{
              background: '#703BF7',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 0 20px rgba(112,59,247,0.3)',
            }}
          >
            Post a Request
          </a>
          <a
            href="/providers"
            style={{
              background: '#0D0D0D',
              color: '#999',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              border: '1px solid #1A1A1A',
            }}
          >
            Browse Providers
          </a>
        </div>
      </div>

      {/* Featured Providers */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>⭐ Featured Providers</h2>
          <a href="/providers" style={{ fontSize: 13, color: '#703BF7' }}>View all →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURED_PROVIDERS.map((provider, i) => (
            <div
              key={i}
              style={{
                background: '#0D0D0D',
                border: '1px solid #262626',
                borderRadius: 12,
                padding: '20px 22px',
                position: 'relative',
              }}
            >
              {provider.featured && (
                <span style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 99,
                  background: 'rgba(245,158,11,0.15)',
                  color: '#F59E0B',
                  border: '1px solid rgba(245,158,11,0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Featured
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(112,59,247,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}>
                  👤
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{provider.name}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{provider.type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>
                  ★ {provider.rating}
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>
                  {provider.engagements} completed
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Requests */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>📋 Recent Requests</h2>
          <a href="/requests" style={{ fontSize: 13, color: '#703BF7' }}>View all →</a>
        </div>
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          {RECENT_REQUESTS.map((req, i) => (
            <a
              key={req.id}
              href={`/requests/${req.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                borderBottom: i < RECENT_REQUESTS.length - 1 ? '1px solid #141414' : 'none',
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(112,59,247,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}>
                📋
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{req.type}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{req.location}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 99,
                  background: 'rgba(16,185,129,0.15)',
                  color: '#10B981',
                }}>
                  {req.status}
                </span>
                <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>{req.posted}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
