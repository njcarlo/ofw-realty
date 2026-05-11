const API = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  buyer:        { bg: 'rgba(6,182,212,0.15)',   color: '#06B6D4' },
  seller:       { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B' },
  realtor:      { bg: 'rgba(112,59,247,0.15)',  color: '#703BF7' },
  broker_admin: { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
  admin:        { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444' },
}

async function getUsers() {
  try {
    const res = await fetch(`${API}/admin/users?limit=50`, { cache: 'no-store' })
    if (res.ok) return { users: await res.json(), isDemo: false }
  } catch {}
  // Demo fallback
  return {
    isDemo: true,
    users: [
      { id: 'u1', full_name: 'Maria Santos', email: 'maria@example.com', role: 'realtor', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), verified: true },
      { id: 'u2', full_name: 'Juan Dela Cruz', email: 'juan@example.com', role: 'realtor', created_at: new Date(Date.now() - 10 * 86400000).toISOString(), verified: false },
      { id: 'u3', full_name: 'Ana Reyes', email: 'ana@example.com', role: 'buyer', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), verified: true },
      { id: 'u4', full_name: 'Pedro Cruz', email: 'pedro@example.com', role: 'broker_admin', created_at: new Date(Date.now() - 30 * 86400000).toISOString(), verified: true },
      { id: 'u5', full_name: 'Lisa Tan', email: 'lisa@example.com', role: 'seller', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), verified: true },
    ],
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })
}

export default async function AdminUsersPage() {
  const { users, isDemo } = await getUsers()

  const roleCounts = users.reduce((acc: Record<string, number>, u: any) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={{ padding: 32, color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Users</h1>
        <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{users.length} registered users</p>
      </div>

      {isDemo && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>Demo Mode</span>
          <span style={{ fontSize: 13, color: '#595959' }}>— API unavailable, showing sample data.</span>
        </div>
      )}

      {/* Role summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(roleCounts).map(([role, count]) => {
          const s = ROLE_STYLE[role] ?? { bg: 'rgba(89,89,89,0.15)', color: '#595959' }
          return (
            <div key={role} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 8, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{count as number}</span>
              <span style={{ fontSize: 12, color: s.color, textTransform: 'capitalize' }}>{role.replace('_', ' ')}</span>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 120px 100px 120px 100px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
          {['Name', 'Email', 'Role', 'Verified', 'Joined', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {users.map((u: any, i: number) => {
          const s = ROLE_STYLE[u.role] ?? { bg: 'rgba(89,89,89,0.15)', color: '#595959' }
          return (
            <div
              key={u.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 120px 100px 120px 100px', padding: '14px 20px', borderBottom: i < users.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{u.full_name ?? '—'}</div>
              <div style={{ fontSize: 13, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
                  {u.role?.replace('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: 13, color: u.verified ? '#10B981' : '#595959' }}>
                {u.verified ? '✓ Yes' : '— No'}
              </div>
              <div style={{ fontSize: 12, color: '#595959' }}>{formatDate(u.created_at)}</div>
              <div>
                <a
                  href={`/users/${u.id}`}
                  style={{ fontSize: 12, color: '#703BF7', padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(112,59,247,0.3)', background: 'rgba(112,59,247,0.08)', textDecoration: 'none' }}
                >
                  View
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
