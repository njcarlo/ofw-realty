import { AdminSidebar } from '@/components/AdminSidebar'
import { supabaseAdmin } from '@/lib/supabase'

const ROLE_COLORS: Record<string, string> = {
  buyer: '#10B981', seller: '#06B6D4', realtor: '#703BF7',
  broker_admin: '#F59E0B', developer: '#8B5CF6', admin: '#EF4444',
}

async function getUsers() {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, email_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default async function UsersPage() {
  const users = await getUsers()
  const byRole = users.reduce((acc: any, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc }, {})

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>All Users</h1>
          <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>{users.length} registered users</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(byRole).map(([role, count]: any) => (
            <div key={role} style={{ background: '#0D0D0D', border: `1px solid ${ROLE_COLORS[role] ?? '#1A1A1A'}30`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: ROLE_COLORS[role] ?? '#fff' }}>{count}</span>
              <span style={{ fontSize: 12, color: '#999', textTransform: 'capitalize' }}>{role.replace('_', ' ')}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 100px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
            {['User', 'Role', 'Email Verified', 'Joined'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {users.map((u, i) => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 100px', padding: '14px 20px', borderBottom: i < users.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{u.full_name ?? '—'}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{u.email}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: `${ROLE_COLORS[u.role] ?? '#595959'}15`, color: ROLE_COLORS[u.role] ?? '#595959', textTransform: 'capitalize', display: 'inline-block' }}>
                {u.role?.replace('_', ' ')}
              </span>
              <span style={{ fontSize: 12, color: u.email_verified ? '#10B981' : '#EF4444' }}>
                {u.email_verified ? '✓ Verified' : '✗ Pending'}
              </span>
              <span style={{ fontSize: 12, color: '#595959' }}>{timeAgo(u.created_at)}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
