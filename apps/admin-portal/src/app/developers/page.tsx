import { AdminSidebar } from '@/components/AdminSidebar'
import { supabaseAdmin } from '@/lib/supabase'

const DEV_URL = process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL ?? 'http://localhost:3005'

async function getDevelopers() {
  try {
    const { data } = await supabaseAdmin
      .from('developer_profiles')
      .select('id, company_name, status, primary_contact, email, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    return data ?? []
  } catch {
    return []
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
}

export default async function DevelopersPage() {
  const developers = await getDevelopers()
  const pending = developers.filter(d => d.status === 'pending_review').length

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Developers</h1>
            <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Real estate developer accounts</p>
          </div>
          <a href={DEV_URL} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '8px 14px' }}>
            Open Developer Portal ↗
          </a>
        </div>

        {pending > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠️</span>
            <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 600 }}>{pending} developer{pending !== 1 ? 's' : ''} pending approval</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {['approved', 'pending_review', 'rejected'].map(status => {
            const count = developers.filter(d => d.status === status).length
            return (
              <div key={status} style={{ background: '#0D0D0D', border: `1px solid ${STATUS_COLORS[status]}30`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: STATUS_COLORS[status] }}>{count}</span>
                <span style={{ fontSize: 12, color: '#999', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
              </div>
            )
          })}
        </div>

        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 100px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
            {['Company', 'Contact', 'Email', 'Status', 'Joined'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {developers.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#595959', fontSize: 14 }}>No developer accounts yet</div>
          ) : developers.map((d, i) => (
            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 100px', padding: '12px 20px', borderBottom: i < developers.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{d.company_name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{d.primary_contact}</div>
              <div style={{ fontSize: 12, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.email}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: `${STATUS_COLORS[d.status] ?? '#595959'}15`, color: STATUS_COLORS[d.status] ?? '#595959', textTransform: 'capitalize', display: 'inline-block' }}>
                {d.status?.replace('_', ' ')}
              </span>
              <div style={{ fontSize: 11, color: '#595959' }}>{timeAgo(d.created_at)}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
