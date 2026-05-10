'use client'
// Services Portal — Requester Dashboard
import { useSession } from '@/components/SessionProvider'

export default function DashboardPage() {
  const { user, loading } = useSession()

  if (loading) {
    return (
      <div style={{ padding: 32, color: '#595959', fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ padding: 32, fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
        <div style={{
          background: '#0D0D0D',
          border: '1px solid #1A1A1A',
          borderRadius: 12,
          padding: '40px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Sign in to access your dashboard</div>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              background: '#703BF7',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 32, fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>My Dashboard</h1>
        <p style={{ fontSize: 14, color: '#595959', margin: '6px 0 0' }}>
          Manage your service requests, proposals, and engagements.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'My Requests', value: '0', icon: '📋', color: '#703BF7' },
          { label: 'Active Engagements', value: '0', icon: '🤝', color: '#10B981' },
          { label: 'Pending Ratings', value: '0', icon: '⭐', color: '#F59E0B' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: '#0D0D0D',
            border: '1px solid #1A1A1A',
            borderRadius: 12,
            padding: '20px 22px',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${kpi.color}15`,
              border: `1px solid ${kpi.color}25`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              marginBottom: 12,
            }}>
              {kpi.icon}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 13, color: '#595959' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#0D0D0D',
        border: '1px solid #1A1A1A',
        borderRadius: 12,
        padding: '40px 32px',
        textAlign: 'center',
        color: '#595959',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Full dashboard coming soon</div>
        <div style={{ fontSize: 13 }}>Track your requests, proposals, and engagements in one place.</div>
      </div>
    </div>
  )
}
