import { AdminSidebar } from '@/components/AdminSidebar'

const PORTALS = [
  { name: 'Web Marketplace',  env: 'NEXT_PUBLIC_WEB_URL',              port: 3000, color: '#10B981' },
  { name: 'Agent Portal',     env: 'NEXT_PUBLIC_AGENT_PORTAL_URL',     port: 3002, color: '#703BF7' },
  { name: 'Broker Portal',    env: 'NEXT_PUBLIC_BROKER_PORTAL_URL',    port: 3003, color: '#F59E0B' },
  { name: 'Admin Portal',     env: '—',                                port: 3004, color: '#EF4444' },
  { name: 'Developer Portal', env: 'NEXT_PUBLIC_DEVELOPER_PORTAL_URL', port: 3005, color: '#8B5CF6' },
  { name: 'Services Portal',  env: 'NEXT_PUBLIC_SERVICES_PORTAL_URL',  port: 3006, color: '#06B6D4' },
  { name: 'AI Concierge',     env: '—',                                port: 3007, color: '#EC4899' },
  { name: 'B2B Network',      env: '—',                                port: 3008, color: '#F97316' },
]

export default function SettingsPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>System configuration and portal overview</p>
        </div>

        {/* Portal map */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Portal Map</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {PORTALS.map(p => (
              <a key={p.name} href={`http://localhost:${p.port}`} target="_blank" rel="noopener noreferrer"
                style={{ background: '#141414', border: `1px solid ${p.color}20`, borderRadius: 10, padding: '14px 16px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${p.color}50`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${p.color}20`)}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: p.color, marginBottom: 4 }}>{p.port}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#595959', fontFamily: 'monospace' }}>{p.env}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Supabase info */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Supabase Project</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Project URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'Not set' },
              { label: 'Service Role Key', value: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set (hidden)' : '✗ Not set' },
              { label: 'Anon Key', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set (hidden)' : '✗ Not set' },
              { label: 'API URL', value: process.env.NEXT_PUBLIC_API_URL ?? 'Not set' },
            ].map(v => (
              <div key={v.label} style={{ background: '#141414', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#595959', marginBottom: 4 }}>{v.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Migrations */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Database Migrations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { n: '000', name: 'Setup' },
              { n: '001', name: 'Core tables (users, listings, brokerages)' },
              { n: '002', name: 'Supporting tables (photos, inquiries)' },
              { n: '003', name: 'Phase 2 (ads, co-broking, leads)' },
              { n: '004', name: 'RLS policies' },
              { n: '005', name: 'Realtime subscriptions' },
              { n: '006–010', name: 'Fixes, storage, listing details' },
              { n: '011–012', name: 'Negotiation deal rooms + RLS' },
              { n: '013–014', name: 'Developer portal schema' },
              { n: '015', name: 'Services portal (providers, requests, engagements)' },
              { n: '016', name: 'B2B Network (profiles, posts, connections, messages)' },
            ].map(m => (
              <div key={m.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid #141414' }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#703BF7', fontWeight: 700, minWidth: 40 }}>{m.n}</span>
                <span style={{ fontSize: 12, color: '#999' }}>{m.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#10B981' }}>✓ Applied</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
