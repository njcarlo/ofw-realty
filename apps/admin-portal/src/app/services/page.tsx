import { AdminSidebar } from '@/components/AdminSidebar'
import { supabaseAdmin } from '@/lib/supabase'

const SERVICES_URL = process.env.NEXT_PUBLIC_SERVICES_PORTAL_URL ?? 'http://localhost:3006'

async function getServicesData() {
  const [providers, requests, engagements] = await Promise.all([
    supabaseAdmin.from('provider_profiles').select('id, full_name, status, avg_rating, completed_engagements, service_types, created_at').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('service_requests').select('id, service_type, status, province, city, created_at').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('engagements').select('id, status, created_at').limit(50),
  ])
  return {
    providers: providers.data ?? [],
    requests: requests.data ?? [],
    engagements: engagements.data ?? [],
  }
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_COLORS: Record<string, string> = {
  approved: '#10B981', pending_review: '#F59E0B', rejected: '#EF4444', suspended: '#595959',
  open: '#703BF7', in_progress: '#F59E0B', completed: '#10B981', cancelled: '#595959',
  active: '#10B981', disputed: '#EF4444',
}

export default async function ServicesPage() {
  const { providers, requests, engagements } = await getServicesData()

  const pendingProviders = providers.filter(p => p.status === 'pending_review').length
  const openRequests = requests.filter(r => r.status === 'open').length
  const activeEngagements = engagements.filter(e => e.status === 'active').length
  const completedEngagements = engagements.filter(e => e.status === 'completed').length

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Services Portal</h1>
            <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Real estate services marketplace</p>
          </div>
          <a href={SERVICES_URL} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#06B6D4', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, padding: '8px 14px' }}>
            Open Services Portal ↗
          </a>
        </div>

        {pendingProviders > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div style={{ fontSize: 14, color: '#F59E0B', fontWeight: 600 }}>{pendingProviders} provider{pendingProviders !== 1 ? 's' : ''} pending approval</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Providers', value: providers.length, color: '#06B6D4' },
            { label: 'Pending Approval', value: pendingProviders, color: '#F59E0B' },
            { label: 'Open Requests', value: openRequests, color: '#703BF7' },
            { label: 'Active Engagements', value: activeEngagements, color: '#10B981' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: `1px solid ${s.color}20`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Providers */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Service Providers</div>
            {providers.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #141414' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</div>
                  <div style={{ fontSize: 10, color: '#595959' }}>{p.service_types?.slice(0, 2).join(', ')}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {p.avg_rating && <div style={{ fontSize: 11, color: '#F59E0B' }}>⭐ {p.avg_rating}</div>}
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 99, background: `${STATUS_COLORS[p.status] ?? '#595959'}15`, color: STATUS_COLORS[p.status] ?? '#595959', textTransform: 'capitalize' }}>
                    {p.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Requests */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Recent Service Requests</div>
            {requests.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #141414' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{r.service_type?.replace('_', ' ')}</div>
                  <div style={{ fontSize: 10, color: '#595959' }}>📍 {r.city}, {r.province}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 99, background: `${STATUS_COLORS[r.status] ?? '#595959'}15`, color: STATUS_COLORS[r.status] ?? '#595959', textTransform: 'capitalize', display: 'block', marginBottom: 2 }}>
                    {r.status}
                  </span>
                  <span style={{ fontSize: 10, color: '#333' }}>{timeAgo(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
