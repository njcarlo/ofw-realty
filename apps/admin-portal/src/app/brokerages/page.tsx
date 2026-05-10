import { AdminSidebar } from '@/components/AdminSidebar'
import { supabaseAdmin } from '@/lib/supabase'

async function getBrokerages() {
  const { data } = await supabaseAdmin
    .from('broker_companies')
    .select('id, name, slug, verified_badge, co_broking, office_address, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

async function getAgentsByBrokerage() {
  const { data } = await supabaseAdmin
    .from('realtors')
    .select('primary_brokerage, verified_badge')
    .not('primary_brokerage', 'is', null)
  const counts: Record<string, number> = {}
  data?.forEach(r => { if (r.primary_brokerage) counts[r.primary_brokerage] = (counts[r.primary_brokerage] ?? 0) + 1 })
  return counts
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default async function BrokeragesPage() {
  const [brokerages, agentCounts] = await Promise.all([getBrokerages(), getAgentsByBrokerage()])

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Brokerages</h1>
          <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>{brokerages.length} registered brokerage companies</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{brokerages.length}</span>
            <span style={{ fontSize: 12, color: '#999' }}>Total Brokerages</span>
          </div>
          <div style={{ background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{brokerages.filter(b => b.verified_badge).length}</span>
            <span style={{ fontSize: 12, color: '#999' }}>Verified</span>
          </div>
          <div style={{ background: '#0D0D0D', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#703BF7' }}>{brokerages.filter(b => b.co_broking).length}</span>
            <span style={{ fontSize: 12, color: '#999' }}>Co-Broking Active</span>
          </div>
        </div>

        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 80px 80px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
            {['Company', 'Location', 'Agents', 'Verified', 'Co-Broke', 'Joined'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {brokerages.map((b, i) => (
            <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 80px 80px', padding: '12px 20px', borderBottom: i < brokerages.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{b.name}</div>
                <div style={{ fontSize: 11, color: '#595959' }}>/{b.slug}</div>
              </div>
              <div style={{ fontSize: 12, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.office_address ?? '—'}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#703BF7' }}>{agentCounts[b.id] ?? 0}</div>
              <span style={{ fontSize: 12, color: b.verified_badge ? '#10B981' : '#595959' }}>{b.verified_badge ? '✓' : '—'}</span>
              <span style={{ fontSize: 12, color: b.co_broking ? '#703BF7' : '#595959' }}>{b.co_broking ? '✓' : '—'}</span>
              <div style={{ fontSize: 11, color: '#595959' }}>{timeAgo(b.created_at)}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
